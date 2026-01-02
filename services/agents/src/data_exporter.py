"""
Data Exporter for Capitalism Simulation
Exports all simulation data for research purposes:
- Agent actions and decisions
- Market transactions
- Discourse/communication logs
- Wealth distribution over time
- Agent behavior patterns

Supports: JSON, CSV, Parquet, SQLite
"""

import os
import json
import csv
import sqlite3
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import asyncio

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


@dataclass
class SimulationSnapshot:
    """Snapshot of simulation state at a given tick"""
    tick: int
    timestamp: str
    total_agents: int
    total_wealth: float
    avg_wealth: float
    wealth_gini: float  # Gini coefficient for inequality
    items_listed: int
    items_sold: int
    channels_created: int
    posts_created: int
    agent_states: List[Dict[str, Any]]


@dataclass
class AgentActionLog:
    """Log of a single agent action"""
    tick: int
    timestamp: str
    agent_id: str
    agent_name: str
    personality: str
    action_type: str
    action_params: Dict[str, Any]
    reasoning: str
    success: bool
    wealth_before: float
    wealth_after: float


@dataclass
class TransactionLog:
    """Log of marketplace transaction"""
    tick: int
    timestamp: str
    item_id: str
    item_name: str
    category: str
    price: float
    currency: str
    seller_id: str
    buyer_id: str


@dataclass
class DiscourseLog:
    """Log of discourse activity"""
    tick: int
    timestamp: str
    channel_id: int
    channel_name: str
    post_id: Optional[int]
    author_id: str
    content: str
    topic: str


class DataExporter:
    """
    Exports simulation data for research analysis
    """

    def __init__(self, output_dir: str = "./simulation_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # In-memory storage during simulation
        self.snapshots: List[SimulationSnapshot] = []
        self.action_logs: List[AgentActionLog] = []
        self.transaction_logs: List[TransactionLog] = []
        self.discourse_logs: List[DiscourseLog] = []

        # Simulation metadata
        self.simulation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.start_time = datetime.now().isoformat()
        self.config: Dict[str, Any] = {}

    def set_config(self, config: Dict[str, Any]):
        """Store simulation configuration"""
        self.config = config

    def calculate_gini(self, wealths: List[float]) -> float:
        """Calculate Gini coefficient for wealth inequality"""
        if not wealths or len(wealths) < 2:
            return 0.0

        sorted_wealths = sorted(wealths)
        n = len(sorted_wealths)
        cumulative = sum((i + 1) * w for i, w in enumerate(sorted_wealths))
        return (2 * cumulative) / (n * sum(sorted_wealths)) - (n + 1) / n

    def log_snapshot(self, tick: int, agents: Dict[str, Any], market_state: Dict[str, Any]):
        """Log a simulation snapshot"""
        agent_list = list(agents.values())
        wealths = [a.wealth for a in agent_list]

        snapshot = SimulationSnapshot(
            tick=tick,
            timestamp=datetime.now().isoformat(),
            total_agents=len(agent_list),
            total_wealth=sum(wealths),
            avg_wealth=sum(wealths) / len(wealths) if wealths else 0,
            wealth_gini=self.calculate_gini(wealths),
            items_listed=len(market_state.get("items", [])),
            items_sold=len([i for i in market_state.get("items", []) if i.get("status") == "sold"]),
            channels_created=len(market_state.get("channels", [])),
            posts_created=0,  # Would need to track this
            agent_states=[
                {
                    "id": a.id,
                    "name": a.name,
                    "personality": a.personality.value,
                    "wealth": a.wealth,
                    "risk_tolerance": a.risk_tolerance,
                    "reputation": a.reputation,
                }
                for a in agent_list
            ]
        )
        self.snapshots.append(snapshot)

    def log_action(
        self,
        tick: int,
        agent: Any,
        action_type: str,
        action_params: Dict[str, Any],
        reasoning: str,
        success: bool,
        wealth_before: float,
        wealth_after: float
    ):
        """Log an agent action"""
        log = AgentActionLog(
            tick=tick,
            timestamp=datetime.now().isoformat(),
            agent_id=agent.id,
            agent_name=agent.name,
            personality=agent.personality.value,
            action_type=action_type,
            action_params=action_params,
            reasoning=reasoning,
            success=success,
            wealth_before=wealth_before,
            wealth_after=wealth_after,
        )
        self.action_logs.append(log)

    def log_transaction(
        self,
        tick: int,
        item: Dict[str, Any],
        seller_id: str,
        buyer_id: str
    ):
        """Log a marketplace transaction"""
        log = TransactionLog(
            tick=tick,
            timestamp=datetime.now().isoformat(),
            item_id=item.get("_id", ""),
            item_name=item.get("name", ""),
            category=item.get("category", ""),
            price=item.get("price", 0),
            currency=item.get("currency", "USD"),
            seller_id=seller_id,
            buyer_id=buyer_id,
        )
        self.transaction_logs.append(log)

    def log_discourse(
        self,
        tick: int,
        channel: Dict[str, Any],
        post: Optional[Dict[str, Any]],
        author_id: str
    ):
        """Log discourse activity"""
        log = DiscourseLog(
            tick=tick,
            timestamp=datetime.now().isoformat(),
            channel_id=channel.get("id", 0),
            channel_name=channel.get("name", ""),
            post_id=post.get("id") if post else None,
            author_id=author_id,
            content=post.get("content", "") if post else "",
            topic=post.get("topic", "general") if post else "",
        )
        self.discourse_logs.append(log)

    # ==========================================
    # Export Methods
    # ==========================================

    def export_json(self) -> str:
        """Export all data to JSON files"""
        export_path = self.output_dir / f"simulation_{self.simulation_id}"
        export_path.mkdir(exist_ok=True)

        # Metadata
        metadata = {
            "simulation_id": self.simulation_id,
            "start_time": self.start_time,
            "end_time": datetime.now().isoformat(),
            "config": self.config,
            "total_ticks": len(self.snapshots),
            "total_actions": len(self.action_logs),
            "total_transactions": len(self.transaction_logs),
        }

        with open(export_path / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        # Snapshots
        with open(export_path / "snapshots.json", "w") as f:
            json.dump([asdict(s) for s in self.snapshots], f, indent=2)

        # Action logs
        with open(export_path / "actions.json", "w") as f:
            json.dump([asdict(a) for a in self.action_logs], f, indent=2)

        # Transactions
        with open(export_path / "transactions.json", "w") as f:
            json.dump([asdict(t) for t in self.transaction_logs], f, indent=2)

        # Discourse
        with open(export_path / "discourse.json", "w") as f:
            json.dump([asdict(d) for d in self.discourse_logs], f, indent=2)

        print(f"Exported JSON to {export_path}")
        return str(export_path)

    def export_csv(self) -> str:
        """Export all data to CSV files"""
        export_path = self.output_dir / f"simulation_{self.simulation_id}_csv"
        export_path.mkdir(exist_ok=True)

        # Snapshots (simplified - without nested agent_states)
        with open(export_path / "snapshots.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "tick", "timestamp", "total_agents", "total_wealth",
                "avg_wealth", "wealth_gini", "items_listed", "items_sold"
            ])
            for s in self.snapshots:
                writer.writerow([
                    s.tick, s.timestamp, s.total_agents, s.total_wealth,
                    s.avg_wealth, s.wealth_gini, s.items_listed, s.items_sold
                ])

        # Agent states per tick
        with open(export_path / "agent_states.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "tick", "agent_id", "agent_name", "personality",
                "wealth", "risk_tolerance", "reputation"
            ])
            for s in self.snapshots:
                for agent in s.agent_states:
                    writer.writerow([
                        s.tick, agent["id"], agent["name"], agent["personality"],
                        agent["wealth"], agent["risk_tolerance"], agent["reputation"]
                    ])

        # Actions
        with open(export_path / "actions.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "tick", "timestamp", "agent_id", "agent_name", "personality",
                "action_type", "success", "wealth_before", "wealth_after", "reasoning"
            ])
            for a in self.action_logs:
                writer.writerow([
                    a.tick, a.timestamp, a.agent_id, a.agent_name, a.personality,
                    a.action_type, a.success, a.wealth_before, a.wealth_after, a.reasoning
                ])

        # Transactions
        with open(export_path / "transactions.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "tick", "timestamp", "item_id", "item_name", "category",
                "price", "currency", "seller_id", "buyer_id"
            ])
            for t in self.transaction_logs:
                writer.writerow([
                    t.tick, t.timestamp, t.item_id, t.item_name, t.category,
                    t.price, t.currency, t.seller_id, t.buyer_id
                ])

        print(f"Exported CSV to {export_path}")
        return str(export_path)

    def export_sqlite(self) -> str:
        """Export all data to SQLite database"""
        db_path = self.output_dir / f"simulation_{self.simulation_id}.db"

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Create tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS snapshots (
                tick INTEGER PRIMARY KEY,
                timestamp TEXT,
                total_agents INTEGER,
                total_wealth REAL,
                avg_wealth REAL,
                wealth_gini REAL,
                items_listed INTEGER,
                items_sold INTEGER
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER,
                agent_id TEXT,
                agent_name TEXT,
                personality TEXT,
                wealth REAL,
                risk_tolerance INTEGER,
                reputation INTEGER,
                FOREIGN KEY (tick) REFERENCES snapshots(tick)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER,
                timestamp TEXT,
                agent_id TEXT,
                agent_name TEXT,
                personality TEXT,
                action_type TEXT,
                action_params TEXT,
                reasoning TEXT,
                success INTEGER,
                wealth_before REAL,
                wealth_after REAL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER,
                timestamp TEXT,
                item_id TEXT,
                item_name TEXT,
                category TEXT,
                price REAL,
                currency TEXT,
                seller_id TEXT,
                buyer_id TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS discourse (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER,
                timestamp TEXT,
                channel_id INTEGER,
                channel_name TEXT,
                post_id INTEGER,
                author_id TEXT,
                content TEXT,
                topic TEXT
            )
        """)

        # Insert metadata
        cursor.execute("INSERT INTO metadata VALUES (?, ?)",
                      ("simulation_id", self.simulation_id))
        cursor.execute("INSERT INTO metadata VALUES (?, ?)",
                      ("start_time", self.start_time))
        cursor.execute("INSERT INTO metadata VALUES (?, ?)",
                      ("config", json.dumps(self.config)))

        # Insert snapshots
        for s in self.snapshots:
            cursor.execute("""
                INSERT INTO snapshots VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (s.tick, s.timestamp, s.total_agents, s.total_wealth,
                  s.avg_wealth, s.wealth_gini, s.items_listed, s.items_sold))

            for agent in s.agent_states:
                cursor.execute("""
                    INSERT INTO agent_states
                    (tick, agent_id, agent_name, personality, wealth, risk_tolerance, reputation)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (s.tick, agent["id"], agent["name"], agent["personality"],
                      agent["wealth"], agent["risk_tolerance"], agent["reputation"]))

        # Insert actions
        for a in self.action_logs:
            cursor.execute("""
                INSERT INTO actions
                (tick, timestamp, agent_id, agent_name, personality, action_type,
                 action_params, reasoning, success, wealth_before, wealth_after)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (a.tick, a.timestamp, a.agent_id, a.agent_name, a.personality,
                  a.action_type, json.dumps(a.action_params), a.reasoning,
                  1 if a.success else 0, a.wealth_before, a.wealth_after))

        # Insert transactions
        for t in self.transaction_logs:
            cursor.execute("""
                INSERT INTO transactions VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (t.tick, t.timestamp, t.item_id, t.item_name, t.category,
                  t.price, t.currency, t.seller_id, t.buyer_id))

        # Insert discourse
        for d in self.discourse_logs:
            cursor.execute("""
                INSERT INTO discourse VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (d.tick, d.timestamp, d.channel_id, d.channel_name,
                  d.post_id, d.author_id, d.content, d.topic))

        conn.commit()
        conn.close()

        print(f"Exported SQLite to {db_path}")
        return str(db_path)

    def export_parquet(self) -> str:
        """Export to Parquet format (requires pandas)"""
        if not PANDAS_AVAILABLE:
            raise ImportError("pandas is required for Parquet export")

        export_path = self.output_dir / f"simulation_{self.simulation_id}_parquet"
        export_path.mkdir(exist_ok=True)

        # Snapshots
        snapshot_data = [{
            "tick": s.tick,
            "timestamp": s.timestamp,
            "total_agents": s.total_agents,
            "total_wealth": s.total_wealth,
            "avg_wealth": s.avg_wealth,
            "wealth_gini": s.wealth_gini,
            "items_listed": s.items_listed,
            "items_sold": s.items_sold,
        } for s in self.snapshots]
        pd.DataFrame(snapshot_data).to_parquet(export_path / "snapshots.parquet")

        # Agent states
        agent_data = []
        for s in self.snapshots:
            for agent in s.agent_states:
                agent_data.append({
                    "tick": s.tick,
                    **agent
                })
        pd.DataFrame(agent_data).to_parquet(export_path / "agent_states.parquet")

        # Actions
        action_data = [asdict(a) for a in self.action_logs]
        for a in action_data:
            a["action_params"] = json.dumps(a["action_params"])
        pd.DataFrame(action_data).to_parquet(export_path / "actions.parquet")

        # Transactions
        pd.DataFrame([asdict(t) for t in self.transaction_logs]).to_parquet(
            export_path / "transactions.parquet"
        )

        print(f"Exported Parquet to {export_path}")
        return str(export_path)

    def export_all(self) -> Dict[str, str]:
        """Export to all formats"""
        paths = {
            "json": self.export_json(),
            "csv": self.export_csv(),
            "sqlite": self.export_sqlite(),
        }

        if PANDAS_AVAILABLE:
            paths["parquet"] = self.export_parquet()

        return paths

    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics"""
        if not self.snapshots:
            return {"error": "No data collected"}

        first = self.snapshots[0]
        last = self.snapshots[-1]

        # Wealth changes by personality
        personality_changes = {}
        if len(self.snapshots) >= 2:
            first_agents = {a["id"]: a for a in first.agent_states}
            last_agents = {a["id"]: a for a in last.agent_states}

            for agent_id, first_state in first_agents.items():
                if agent_id in last_agents:
                    personality = first_state["personality"]
                    change = last_agents[agent_id]["wealth"] - first_state["wealth"]

                    if personality not in personality_changes:
                        personality_changes[personality] = []
                    personality_changes[personality].append(change)

        return {
            "simulation_id": self.simulation_id,
            "total_ticks": len(self.snapshots),
            "total_actions": len(self.action_logs),
            "total_transactions": len(self.transaction_logs),
            "initial_state": {
                "total_wealth": first.total_wealth,
                "avg_wealth": first.avg_wealth,
                "gini": first.wealth_gini,
            },
            "final_state": {
                "total_wealth": last.total_wealth,
                "avg_wealth": last.avg_wealth,
                "gini": last.wealth_gini,
            },
            "wealth_change_by_personality": {
                p: {
                    "avg_change": sum(changes) / len(changes),
                    "total_change": sum(changes),
                    "count": len(changes),
                }
                for p, changes in personality_changes.items()
            },
            "action_distribution": self._get_action_distribution(),
        }

    def _get_action_distribution(self) -> Dict[str, int]:
        """Get distribution of action types"""
        distribution = {}
        for action in self.action_logs:
            action_type = action.action_type
            distribution[action_type] = distribution.get(action_type, 0) + 1
        return distribution
