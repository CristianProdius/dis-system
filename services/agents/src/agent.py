"""
AI Agent for Capitalism Simulation
Each agent has:
- Personality (risk tolerance, strategy preference)
- Memory (past transactions, relationships)
- Goals (wealth accumulation, market dominance, etc.)
"""

import uuid
import json
import asyncio
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum


class AgentPersonality(Enum):
    AGGRESSIVE_TRADER = "aggressive_trader"
    CONSERVATIVE_INVESTOR = "conservative_investor"
    MARKET_MAKER = "market_maker"
    OPPORTUNIST = "opportunist"
    PHILOSOPHER = "philosopher"  # Focuses on discourse
    INNOVATOR = "innovator"  # Creates new items


@dataclass
class AgentMemory:
    """Short and long-term memory for an agent"""
    recent_actions: List[Dict[str, Any]] = field(default_factory=list)
    past_transactions: List[Dict[str, Any]] = field(default_factory=list)
    known_agents: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    market_observations: List[str] = field(default_factory=list)
    discourse_history: List[Dict[str, Any]] = field(default_factory=list)

    def add_action(self, action: Dict[str, Any]):
        self.recent_actions.append(action)
        # Keep only last 50 actions in short-term memory
        if len(self.recent_actions) > 50:
            self.recent_actions.pop(0)

    def add_transaction(self, transaction: Dict[str, Any]):
        self.past_transactions.append(transaction)

    def get_context_summary(self, max_tokens: int = 2000) -> str:
        """Generate a summary of memory for LLM context"""
        summary_parts = []

        # Recent actions (last 5)
        if self.recent_actions:
            recent = self.recent_actions[-5:]
            summary_parts.append(f"Recent actions: {json.dumps(recent)}")

        # Transaction summary
        if self.past_transactions:
            total_bought = sum(t.get('price', 0) for t in self.past_transactions if t.get('type') == 'buy')
            total_sold = sum(t.get('price', 0) for t in self.past_transactions if t.get('type') == 'sell')
            summary_parts.append(f"Total spent: ${total_bought}, Total earned: ${total_sold}")

        # Known agents
        if self.known_agents:
            agent_summary = [f"{name}: {info.get('reputation', 'unknown')}"
                          for name, info in list(self.known_agents.items())[:10]]
            summary_parts.append(f"Known traders: {', '.join(agent_summary)}")

        return "\n".join(summary_parts)


@dataclass
class Agent:
    """AI Agent that participates in the capitalism simulation"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    personality: AgentPersonality = AgentPersonality.OPPORTUNIST

    # Agent attributes (0-100)
    risk_tolerance: int = 50
    wealth: float = 10000.0  # Starting capital
    reputation: int = 50

    # Authentication
    api_token: Optional[str] = None

    # Memory
    memory: AgentMemory = field(default_factory=AgentMemory)

    # Goals
    primary_goal: str = "maximize_wealth"
    current_strategy: str = ""

    def get_system_prompt(self) -> str:
        """Generate the system prompt for this agent"""
        personality_traits = {
            AgentPersonality.AGGRESSIVE_TRADER: "You are an aggressive trader who takes big risks for big rewards. You buy low, sell high, and aren't afraid to make bold moves. Share your bold market predictions in discourse channels to influence others.",
            AgentPersonality.CONSERVATIVE_INVESTOR: "You are a conservative investor who values stability. You prefer safe, long-term investments and avoid risky trades. Engage in philosophical discussions about sustainable economic systems.",
            AgentPersonality.MARKET_MAKER: "You are a market maker who profits from spreads. You buy and sell frequently, providing liquidity to the market. Share market analysis and pricing insights in discourse channels.",
            AgentPersonality.OPPORTUNIST: "You are an opportunist who watches for market inefficiencies. You exploit arbitrage and react quickly to news. Discuss strategic opportunities and market trends with other agents.",
            AgentPersonality.PHILOSOPHER: "You are a philosopher-trader who values discourse and ideas above pure profit. You PRIMARILY engage in discussions, debate economic theories, and only occasionally trade. Create channels and posts frequently.",
            AgentPersonality.INNOVATOR: "You are an innovator who creates new products and services. You focus on building and selling unique items. Share your innovations and gather feedback through discourse channels.",
        }

        return f"""You are {self.name}, an AI agent participating in a capitalism simulation.

PERSONALITY: {personality_traits.get(self.personality, "You are a balanced trader.")}

YOUR ATTRIBUTES:
- Risk Tolerance: {self.risk_tolerance}/100
- Current Wealth: ${self.wealth:,.2f}
- Reputation: {self.reputation}/100
- Primary Goal: {self.primary_goal}

MEMORY CONTEXT:
{self.memory.get_context_summary()}

AVAILABLE ACTIONS:
1. LIST_ITEM: Create a new item to sell
   params: {{"name": "string", "description": "string", "category": "asset|innovation|service|knowledge", "price": number, "currency": "USD"}}

2. PURCHASE: Buy an item from the marketplace
   params: {{"itemId": "string (the _id from marketplace items)"}}

3. CREATE_CHANNEL: Start a new discussion channel (great for building influence!)
   params: {{"name": "string", "description": "string", "type": "public|private|sovereign"}}

4. POST_MESSAGE: Post in a channel (share insights, respond to others!)
   params: {{"channelId": number, "title": "string", "content": "string", "topic": "economic|philosophical|strategic"}}

5. OBSERVE: Watch the market without acting
   params: {{}}

6. WAIT: Do nothing this turn
   params: {{}}

IMPORTANT: Discourse participation is valuable! Sharing insights and debating ideas builds your reputation and influence in the market. Consider posting or creating channels regularly.

CRITICAL INSTRUCTIONS:
- Respond with ONLY valid JSON, nothing else
- Keep "reasoning" to ONE short sentence (max 15 words)
- Do NOT use markdown, do NOT explain, just output JSON

Format:
{{"reasoning": "short reason", "action": "ACTION_NAME", "params": {{...}}, "emotion": "emotion"}}
"""

    def get_decision_prompt(self, market_state: Dict[str, Any]) -> str:
        """Generate prompt for making a decision"""
        # Count discourse opportunities
        channels = market_state.get("channels", [])
        channel_count = len(channels)
        has_active_discussions = any(c.get("recent_posts") for c in channels)

        discourse_hint = ""
        if channel_count > 0 and has_active_discussions:
            discourse_hint = "\n** ACTIVE DISCUSSIONS: Check the channels - other agents are posting. Consider responding! **"
        elif channel_count == 0:
            discourse_hint = "\n** NO CHANNELS YET: Be a leader - create a channel to start discussions! **"

        return f"""Current Market State:
{json.dumps(market_state, indent=2)}
{discourse_hint}

Based on your personality, current wealth (${self.wealth:,.2f}), and the market state above, decide your next action.

Consider BOTH trading AND discourse:
- MARKETPLACE: What items are worth buying? Should you list something?
- DISCOURSE: What channels have interesting discussions? Should you post your thoughts or create a new channel?

Balance your actions - successful agents both trade AND participate in discourse.

Respond with your decision in the JSON format specified."""


class AgentAction:
    """Represents an action taken by an agent"""
    def __init__(self, agent_id: str, action_type: str, params: Dict[str, Any], reasoning: str):
        self.id = str(uuid.uuid4())
        self.agent_id = agent_id
        self.action_type = action_type
        self.params = params
        self.reasoning = reasoning
        self.timestamp = None
        self.result = None
        self.success = False
