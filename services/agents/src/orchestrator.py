"""
Agent Orchestrator
Manages 100+ AI agents in the capitalism simulation
Handles:
- Agent lifecycle (creation, destruction)
- Market ticks (synchronized agent actions)
- Memory management
- API interactions with marketplace/discourse
"""

import asyncio
import json
import random
import sys
import traceback
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
import httpx

from .agent import Agent, AgentPersonality, AgentAction
from .llm_client import LLMClient, get_llm_client
from .data_exporter import DataExporter


def log(message: str):
    """Print with timestamp and immediate flush"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)
    sys.stdout.flush()


@dataclass
class MarketState:
    """Current state of the market"""
    tick: int = 0
    items: List[Dict[str, Any]] = field(default_factory=list)
    channels: List[Dict[str, Any]] = field(default_factory=list)
    recent_transactions: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tick": self.tick,
            "available_items": len([i for i in self.items if i.get("status") == "available"]),
            "items": self.items[:20],  # Limit to prevent context overflow
            "channels": self.channels[:10],
            "recent_transactions": self.recent_transactions[-10:],
            "timestamp": self.timestamp
        }


class AgentOrchestrator:
    """
    Orchestrates 100+ AI agents in the capitalism simulation
    """

    def __init__(
        self,
        gateway_url: str = "http://localhost:8000",
        llm_provider: str = "vllm",
        llm_config: Optional[Dict[str, Any]] = None,
        batch_size: int = 20,  # Number of agents to process in parallel
    ):
        self.gateway_url = gateway_url
        self.agents: Dict[str, Agent] = {}
        self.llm_client: Optional[LLMClient] = None
        self.llm_provider = llm_provider
        self.llm_config = llm_config or {}
        self.batch_size = batch_size
        self.market_state = MarketState()
        self.http_client: Optional[httpx.AsyncClient] = None
        self.running = False
        self.tick_interval = 5.0  # Seconds between market ticks
        self.data_exporter = DataExporter()

    async def start(self):
        """Initialize the orchestrator"""
        self.http_client = httpx.AsyncClient(timeout=30.0)
        self.llm_client = get_llm_client(self.llm_provider, **self.llm_config)
        self.running = True
        log(f"Orchestrator started with {self.llm_provider} LLM")
        log(f"LLM config: {self.llm_config}")

    async def stop(self):
        """Shutdown the orchestrator"""
        self.running = False
        if self.http_client:
            await self.http_client.aclose()
        if self.llm_client:
            await self.llm_client.close()
        log("Orchestrator stopped")

    async def create_agent(
        self,
        name: str,
        personality: AgentPersonality = AgentPersonality.OPPORTUNIST,
        initial_wealth: float = 10000.0,
        risk_tolerance: int = 50
    ) -> Agent:
        """Create a new AI agent and register it with the system"""
        agent = Agent(
            name=name,
            personality=personality,
            wealth=initial_wealth,
            risk_tolerance=risk_tolerance
        )

        # Register agent with the gateway (create user account)
        password = f"agent_{agent.id[:8]}"
        try:
            # Register
            response = await self.http_client.post(
                f"{self.gateway_url}/auth/register",
                json={"username": name, "password": password}
            )

            if response.status_code == 400:
                # User might already exist, try login
                pass
            else:
                response.raise_for_status()

            # Login to get token
            response = await self.http_client.post(
                f"{self.gateway_url}/auth/login",
                json={"username": name, "password": password}
            )
            response.raise_for_status()
            data = response.json()
            agent.api_token = data["token"]

        except Exception as e:
            log(f"Failed to register agent {name}: {e}")
            return None

        self.agents[agent.id] = agent
        log(f"Created agent: {name} ({personality.value})")
        return agent

    async def create_agent_population(
        self,
        count: int = 100,
        personality_distribution: Optional[Dict[AgentPersonality, float]] = None
    ) -> List[Agent]:
        """Create a population of agents with diverse personalities"""
        if personality_distribution is None:
            # Increased philosopher and innovator for more discourse activity
            personality_distribution = {
                AgentPersonality.AGGRESSIVE_TRADER: 0.15,
                AgentPersonality.CONSERVATIVE_INVESTOR: 0.15,
                AgentPersonality.MARKET_MAKER: 0.15,
                AgentPersonality.OPPORTUNIST: 0.20,
                AgentPersonality.PHILOSOPHER: 0.20,  # Increased from 0.1 for more discourse
                AgentPersonality.INNOVATOR: 0.15,    # Increased from 0.1
            }

        agents = []
        for i in range(count):
            # Select personality based on distribution
            r = random.random()
            cumulative = 0
            personality = AgentPersonality.OPPORTUNIST
            for p, prob in personality_distribution.items():
                cumulative += prob
                if r <= cumulative:
                    personality = p
                    break

            # Vary initial wealth and risk tolerance
            initial_wealth = random.gauss(10000, 3000)
            initial_wealth = max(1000, initial_wealth)  # Minimum $1000

            risk_tolerance = random.randint(20, 80)

            agent = await self.create_agent(
                name=f"Agent_{i:03d}",
                personality=personality,
                initial_wealth=initial_wealth,
                risk_tolerance=risk_tolerance
            )
            if agent:
                agents.append(agent)

            # Small delay to avoid overwhelming the auth system
            await asyncio.sleep(0.05)

        log(f"Created {len(agents)} agents")
        return agents

    async def fetch_market_state(self) -> MarketState:
        """Fetch current market state from services"""
        # Get a valid token from any agent
        token = None
        for agent in self.agents.values():
            if agent.api_token:
                token = agent.api_token
                break

        if not token:
            log("No valid agent tokens available")
            return self.market_state

        headers = {"Authorization": f"Bearer {token}"}

        try:
            # Fetch marketplace items
            items_response = await self.http_client.get(
                f"{self.gateway_url}/marketplace/list",
                headers=headers
            )
            items_data = items_response.json() if items_response.status_code == 200 else {"items": []}

            # Fetch discourse channels
            channels_response = await self.http_client.get(
                f"{self.gateway_url}/discourse/channels",
                headers=headers
            )
            channels_data = channels_response.json() if channels_response.status_code == 200 else {"channels": []}

            # Fetch recent posts from top 3 channels so agents can see discussions
            channels_list = channels_data.get("channels", [])
            for channel in channels_list[:3]:  # Only fetch from first 3 channels
                try:
                    channel_detail = await self.http_client.get(
                        f"{self.gateway_url}/discourse/channel/{channel['id']}",
                        headers=headers
                    )
                    if channel_detail.status_code == 200:
                        detail_data = channel_detail.json()
                        # Add recent posts to channel data (limit to 5 most recent)
                        channel["recent_posts"] = detail_data.get("posts", [])[:5]
                except Exception:
                    pass  # Skip if fetching channel details fails

            self.market_state = MarketState(
                tick=self.market_state.tick + 1,
                items=items_data.get("items", []),
                channels=channels_list,
                timestamp=datetime.now().isoformat()
            )

        except Exception as e:
            log(f"Error fetching market state: {e}")
            traceback.print_exc()

        return self.market_state

    async def execute_agent_action(self, agent: Agent, action: AgentAction) -> bool:
        """Execute an agent's action against the API"""
        if not agent.api_token:
            return False

        headers = {
            "Authorization": f"Bearer {agent.api_token}",
            "Content-Type": "application/json"
        }

        try:
            if action.action_type == "LIST_ITEM":
                response = await self.http_client.post(
                    f"{self.gateway_url}/marketplace/item",
                    headers=headers,
                    json=action.params
                )

            elif action.action_type == "PURCHASE":
                response = await self.http_client.post(
                    f"{self.gateway_url}/marketplace/purchase",
                    headers=headers,
                    json={"itemId": action.params.get("itemId")}
                )
                if response.status_code == 200:
                    # Update agent wealth
                    item_price = action.params.get("price", 0)
                    agent.wealth -= item_price

            elif action.action_type == "CREATE_CHANNEL":
                response = await self.http_client.post(
                    f"{self.gateway_url}/discourse/channel",
                    headers=headers,
                    json=action.params
                )

            elif action.action_type == "POST_MESSAGE":
                response = await self.http_client.post(
                    f"{self.gateway_url}/discourse/post",
                    headers=headers,
                    json=action.params
                )

            elif action.action_type in ["OBSERVE", "WAIT"]:
                return True  # No API call needed

            else:
                log(f"Unknown action type: {action.action_type}")
                return False

            action.success = response.status_code < 400
            action.result = response.json() if action.success else response.text
            return action.success

        except Exception as e:
            log(f"Error executing action for {agent.name}: {e}")
            action.result = str(e)
            return False

    async def process_agent_batch(self, agents: List[Agent]) -> List[AgentAction]:
        """Process a batch of agents in parallel using LLM"""
        prompts = []
        market_dict = self.market_state.to_dict()

        for agent in agents:
            prompts.append({
                "system_prompt": agent.get_system_prompt(),
                "prompt": agent.get_decision_prompt(market_dict)
            })

        # Batch generate decisions
        responses = await self.llm_client.batch_generate(prompts)

        actions = []
        for agent, response in zip(agents, responses):
            try:
                # Parse JSON response
                decision = json.loads(response)
                action = AgentAction(
                    agent_id=agent.id,
                    action_type=decision.get("action", "WAIT"),
                    params=decision.get("params", {}),
                    reasoning=decision.get("reasoning", "")
                )

                # Update agent memory
                agent.memory.add_action({
                    "tick": self.market_state.tick,
                    "action": action.action_type,
                    "params": action.params,
                    "reasoning": action.reasoning
                })

                actions.append((agent, action))

            except json.JSONDecodeError as e:
                log(f"Failed to parse response for {agent.name}: {response[:200]}")
                log(f"JSON error: {e}")
                actions.append((agent, AgentAction(agent.id, "WAIT", {}, "Parse error")))

        return actions

    async def run_tick(self):
        """Run a single market tick"""
        log(f"\n{'='*50}")
        log(f"MARKET TICK {self.market_state.tick + 1}")
        log(f"{'='*50}")

        # Fetch current market state
        await self.fetch_market_state()

        # Log snapshot for data export
        self.data_exporter.log_snapshot(
            tick=self.market_state.tick,
            agents=self.agents,
            market_state=self.market_state.to_dict()
        )

        # Process agents in batches
        agent_list = list(self.agents.values())
        all_actions = []

        for i in range(0, len(agent_list), self.batch_size):
            batch = agent_list[i:i + self.batch_size]
            actions = await self.process_agent_batch(batch)
            all_actions.extend(actions)

        # Execute all actions and log them
        successful = 0
        for agent, action in all_actions:
            wealth_before = agent.wealth

            if action.action_type not in ["OBSERVE", "WAIT"]:
                success = await self.execute_agent_action(agent, action)
                if success:
                    successful += 1
                log(f"  {agent.name}: {action.action_type} - {'Success' if success else 'Failed'}")

                # Log action for data export
                self.data_exporter.log_action(
                    tick=self.market_state.tick,
                    agent=agent,
                    action_type=action.action_type,
                    action_params=action.params,
                    reasoning=action.reasoning,
                    success=success,
                    wealth_before=wealth_before,
                    wealth_after=agent.wealth
                )

        log(f"\nTick {self.market_state.tick} complete: {successful}/{len(all_actions)} actions succeeded")

    async def run_simulation(self, ticks: int = 100):
        """Run the full simulation for a number of ticks"""
        log(f"Starting simulation for {ticks} ticks with {len(self.agents)} agents")

        # Set config for data export
        self.data_exporter.set_config({
            "total_ticks": ticks,
            "agent_count": len(self.agents),
            "tick_interval": self.tick_interval,
            "llm_provider": self.llm_provider,
            "batch_size": self.batch_size,
        })

        for tick in range(ticks):
            if not self.running:
                break

            await self.run_tick()
            await asyncio.sleep(self.tick_interval)

        log(f"\nSimulation complete after {self.market_state.tick} ticks")

        # Print final statistics
        self.print_statistics()

        # Auto-export data
        log("\nExporting simulation data...")
        paths = self.data_exporter.export_all()
        log(f"Data exported to: {paths}")

    def print_statistics(self):
        """Print simulation statistics"""
        log("\n" + "=" * 50)
        log("SIMULATION STATISTICS")
        log("=" * 50)

        if not self.agents:
            log("No agents in simulation")
            return

        wealths = [a.wealth for a in self.agents.values()]
        log(f"Total Agents: {len(self.agents)}")
        log(f"Total Wealth: ${sum(wealths):,.2f}")
        log(f"Average Wealth: ${sum(wealths)/len(wealths):,.2f}")
        log(f"Richest Agent: ${max(wealths):,.2f}")
        log(f"Poorest Agent: ${min(wealths):,.2f}")

        # Wealth by personality
        by_personality = {}
        for agent in self.agents.values():
            p = agent.personality.value
            if p not in by_personality:
                by_personality[p] = []
            by_personality[p].append(agent.wealth)

        log("\nWealth by Personality:")
        for personality, wealths in by_personality.items():
            avg = sum(wealths) / len(wealths)
            log(f"  {personality}: ${avg:,.2f} avg ({len(wealths)} agents)")
