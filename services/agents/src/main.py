"""
AI Agent Service - Main Entry Point
FastAPI service for managing AI agents in the capitalism simulation
"""

import asyncio
import os
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .orchestrator import AgentOrchestrator
from .agent import AgentPersonality


# Configuration from environment
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8000")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")  # ollama, vllm, anthropic
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1:8b")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "10"))

# Global orchestrator instance
orchestrator: Optional[AgentOrchestrator] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global orchestrator

    llm_config = {
        "base_url": LLM_BASE_URL,
        "model": LLM_MODEL,
    }

    orchestrator = AgentOrchestrator(
        gateway_url=GATEWAY_URL,
        llm_provider=LLM_PROVIDER,
        llm_config=llm_config,
        batch_size=BATCH_SIZE,
    )
    await orchestrator.start()
    print(f"Agent service started with {LLM_PROVIDER} ({LLM_MODEL})")

    yield

    await orchestrator.stop()
    print("Agent service stopped")


app = FastAPI(
    title="AI Agent Service",
    description="Manages AI agents for the Capitalism Simulation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class CreateAgentRequest(BaseModel):
    name: str
    personality: str = "opportunist"
    initial_wealth: float = 10000.0
    risk_tolerance: int = 50


class CreatePopulationRequest(BaseModel):
    count: int = 100
    personality_distribution: Optional[Dict[str, float]] = None


class RunSimulationRequest(BaseModel):
    ticks: int = 100
    tick_interval: float = 5.0


class AgentResponse(BaseModel):
    id: str
    name: str
    personality: str
    wealth: float
    risk_tolerance: int
    reputation: int


# Background task for simulation
simulation_task: Optional[asyncio.Task] = None


async def run_simulation_background(ticks: int, tick_interval: float):
    """Background task to run simulation"""
    orchestrator.tick_interval = tick_interval
    await orchestrator.run_simulation(ticks)


# Endpoints
@app.get("/")
async def root():
    """Service info"""
    return {
        "service": "AI Agent Service",
        "version": "1.0.0",
        "llm_provider": LLM_PROVIDER,
        "llm_model": LLM_MODEL,
        "agent_count": len(orchestrator.agents) if orchestrator else 0,
        "simulation_running": orchestrator.running if orchestrator else False,
    }


@app.post("/agents", response_model=AgentResponse)
async def create_agent(request: CreateAgentRequest):
    """Create a single AI agent"""
    personality_map = {
        "aggressive_trader": AgentPersonality.AGGRESSIVE_TRADER,
        "conservative_investor": AgentPersonality.CONSERVATIVE_INVESTOR,
        "market_maker": AgentPersonality.MARKET_MAKER,
        "opportunist": AgentPersonality.OPPORTUNIST,
        "philosopher": AgentPersonality.PHILOSOPHER,
        "innovator": AgentPersonality.INNOVATOR,
    }

    personality = personality_map.get(request.personality, AgentPersonality.OPPORTUNIST)

    agent = await orchestrator.create_agent(
        name=request.name,
        personality=personality,
        initial_wealth=request.initial_wealth,
        risk_tolerance=request.risk_tolerance,
    )

    if not agent:
        raise HTTPException(status_code=500, detail="Failed to create agent")

    return AgentResponse(
        id=agent.id,
        name=agent.name,
        personality=agent.personality.value,
        wealth=agent.wealth,
        risk_tolerance=agent.risk_tolerance,
        reputation=agent.reputation,
    )


@app.post("/agents/population")
async def create_population(request: CreatePopulationRequest):
    """Create a population of AI agents"""
    personality_map = {
        "aggressive_trader": AgentPersonality.AGGRESSIVE_TRADER,
        "conservative_investor": AgentPersonality.CONSERVATIVE_INVESTOR,
        "market_maker": AgentPersonality.MARKET_MAKER,
        "opportunist": AgentPersonality.OPPORTUNIST,
        "philosopher": AgentPersonality.PHILOSOPHER,
        "innovator": AgentPersonality.INNOVATOR,
    }

    distribution = None
    if request.personality_distribution:
        distribution = {
            personality_map[k]: v
            for k, v in request.personality_distribution.items()
            if k in personality_map
        }

    agents = await orchestrator.create_agent_population(
        count=request.count,
        personality_distribution=distribution,
    )

    return {
        "created": len(agents),
        "requested": request.count,
        "agents": [
            {"id": a.id, "name": a.name, "personality": a.personality.value}
            for a in agents
        ]
    }


@app.get("/agents")
async def list_agents():
    """List all agents"""
    return {
        "count": len(orchestrator.agents),
        "agents": [
            AgentResponse(
                id=a.id,
                name=a.name,
                personality=a.personality.value,
                wealth=a.wealth,
                risk_tolerance=a.risk_tolerance,
                reputation=a.reputation,
            )
            for a in orchestrator.agents.values()
        ]
    }


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get agent details"""
    agent = orchestrator.agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return {
        "id": agent.id,
        "name": agent.name,
        "personality": agent.personality.value,
        "wealth": agent.wealth,
        "risk_tolerance": agent.risk_tolerance,
        "reputation": agent.reputation,
        "memory": {
            "recent_actions": agent.memory.recent_actions[-10:],
            "transaction_count": len(agent.memory.past_transactions),
            "known_agents": len(agent.memory.known_agents),
        }
    }


@app.post("/simulation/start")
async def start_simulation(request: RunSimulationRequest, background_tasks: BackgroundTasks):
    """Start the simulation in the background"""
    global simulation_task

    if orchestrator.running and simulation_task and not simulation_task.done():
        raise HTTPException(status_code=400, detail="Simulation already running")

    if len(orchestrator.agents) == 0:
        raise HTTPException(status_code=400, detail="No agents created. Create agents first.")

    orchestrator.running = True
    simulation_task = asyncio.create_task(
        run_simulation_background(request.ticks, request.tick_interval)
    )

    return {
        "status": "started",
        "ticks": request.ticks,
        "tick_interval": request.tick_interval,
        "agent_count": len(orchestrator.agents),
    }


@app.post("/simulation/stop")
async def stop_simulation():
    """Stop the running simulation"""
    orchestrator.running = False
    return {"status": "stopping"}


@app.get("/simulation/status")
async def simulation_status():
    """Get current simulation status"""
    return {
        "running": orchestrator.running,
        "current_tick": orchestrator.market_state.tick,
        "agent_count": len(orchestrator.agents),
        "market_state": orchestrator.market_state.to_dict(),
    }


@app.get("/simulation/stats")
async def simulation_stats():
    """Get simulation statistics"""
    if not orchestrator.agents:
        return {"error": "No agents in simulation"}

    wealths = [a.wealth for a in orchestrator.agents.values()]

    by_personality = {}
    for agent in orchestrator.agents.values():
        p = agent.personality.value
        if p not in by_personality:
            by_personality[p] = []
        by_personality[p].append(agent.wealth)

    return {
        "total_agents": len(orchestrator.agents),
        "current_tick": orchestrator.market_state.tick,
        "wealth": {
            "total": sum(wealths),
            "average": sum(wealths) / len(wealths),
            "max": max(wealths),
            "min": min(wealths),
        },
        "by_personality": {
            p: {
                "count": len(w),
                "average_wealth": sum(w) / len(w),
                "total_wealth": sum(w),
            }
            for p, w in by_personality.items()
        }
    }


@app.post("/tick")
async def manual_tick():
    """Manually trigger a single market tick"""
    if len(orchestrator.agents) == 0:
        raise HTTPException(status_code=400, detail="No agents created")

    await orchestrator.run_tick()

    return {
        "tick": orchestrator.market_state.tick,
        "agent_count": len(orchestrator.agents),
    }


# ==========================================
# Data Export Endpoints
# ==========================================

@app.get("/export/summary")
async def export_summary():
    """Get simulation summary statistics"""
    return orchestrator.data_exporter.get_summary()


@app.post("/export/json")
async def export_json():
    """Export all simulation data to JSON"""
    try:
        path = orchestrator.data_exporter.export_json()
        return {"status": "success", "path": path, "format": "json"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export/csv")
async def export_csv():
    """Export all simulation data to CSV"""
    try:
        path = orchestrator.data_exporter.export_csv()
        return {"status": "success", "path": path, "format": "csv"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export/sqlite")
async def export_sqlite():
    """Export all simulation data to SQLite database"""
    try:
        path = orchestrator.data_exporter.export_sqlite()
        return {"status": "success", "path": path, "format": "sqlite"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export/parquet")
async def export_parquet():
    """Export all simulation data to Parquet format"""
    try:
        path = orchestrator.data_exporter.export_parquet()
        return {"status": "success", "path": path, "format": "parquet"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export/all")
async def export_all():
    """Export all simulation data to all formats"""
    try:
        paths = orchestrator.data_exporter.export_all()
        return {"status": "success", "paths": paths}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/export/download/{format}")
async def download_export(format: str):
    """Download exported data (returns file path for now)"""
    from fastapi.responses import FileResponse
    import os

    sim_id = orchestrator.data_exporter.simulation_id
    base_path = orchestrator.data_exporter.output_dir

    if format == "sqlite":
        file_path = base_path / f"simulation_{sim_id}.db"
    elif format == "json":
        file_path = base_path / f"simulation_{sim_id}" / "metadata.json"
    elif format == "csv":
        file_path = base_path / f"simulation_{sim_id}_csv" / "snapshots.csv"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown format: {format}")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Export not found. Run export first.")

    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="application/octet-stream"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
