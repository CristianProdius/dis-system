# Capitalism Simulation - Distributed Systems MVP

**Course:** FAF.PAD 21.1 Autumn 2025
**Assignment:** Topic 10 - Capitalism Simulation

A microservices-based platform demonstrating distributed systems concepts through a capitalism simulation with free market exchange and communication services.

## Architecture

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                     MONITORING                               │
                                    │  ┌─────────────┐         ┌─────────────┐                    │
                                    │  │ Prometheus  │◄────────│   Grafana   │                    │
                                    │  │   :9090     │         │   :3001     │                    │
                                    │  └──────┬──────┘         └─────────────┘                    │
                                    └─────────┼───────────────────────────────────────────────────┘
                                              │ scrapes /metrics
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
┌──────────┐   ┌─────────────────────────────────────────────────────────────────┐
│          │   │                    API GATEWAY (Python FastAPI)                  │
│  CLIENT  │──►│  ┌─────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  :3000   │   │  │  Redis  │  │  Round Robin LB  │  │  JWT Authentication    │  │
└──────────┘   │  │  Cache  │  │  (in-code impl)  │  │  /auth/register,login  │  │
               │  └─────────┘  └──────────────────┘  └────────────────────────┘  │
               │                         :8000                                    │
               └───────────────────────┬──────────────────────┬──────────────────┘
                                       │                      │
              ┌────────────────────────┼──────────────────────┼────────────────────┐
              │                        │                      │                    │
              ▼                        ▼                      ▼                    ▼
┌─────────────────────────────────────────────┐  ┌─────────────────────────────────────────────┐
│      MARKETPLACE SERVICE (Node.js x3)       │  │       DISCOURSE SERVICE (Node.js x3)        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ :3001   │ │ :3002   │ │ :3003   │       │  │  │ :4001   │ │ :4002   │ │ :4003   │       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │  │  └────┬────┘ └────┬────┘ └────┬────┘       │
│       └───────────┴───────────┘             │  │       └───────────┴───────────┘             │
│                   │                         │  │                   │                         │
│          ┌────────────────┐                 │  │          ┌────────────────┐                 │
│          │    MongoDB     │                 │  │          │   PostgreSQL   │                 │
│          └────────────────┘                 │  │          └────────────────┘                 │
└─────────────────────────────────────────────┘  └─────────────────────────────────────────────┘
```

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down -v
```

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React demo application |
| Gateway API | http://localhost:8000 | FastAPI gateway |
| API Docs | http://localhost:8000/docs | Auto-generated OpenAPI docs |
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3004 | Monitoring dashboard (admin/admin) |

## API Endpoints

### Authentication (No token required)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login, returns JWT token

### Marketplace (Token required)
- `GET /marketplace/list` - List items (cached)
- `GET /marketplace/item/{id}` - Get item details (cached)
- `POST /marketplace/item` - Create listing
- `POST /marketplace/purchase` - Purchase item

### Discourse (Token required)
- `GET /discourse/channels` - List channels (cached)
- `GET /discourse/channel/{id}` - Get channel with posts (cached)
- `POST /discourse/channel` - Create channel
- `POST /discourse/post` - Create post

## Requirements Checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | 2 different languages | Python (Gateway), Node.js (Services) |
| 2 | 2 services with 3 replicas each | marketplace-1/2/3, discourse-1/2/3 |
| 3 | 4+ business logic endpoints per service | 4 each + status endpoint |
| 4 | Separated database per service | MongoDB (Marketplace), PostgreSQL (Discourse) |
| 5 | Gateway in different language | Python FastAPI |
| 6 | Gateway proxies 8 business endpoints | 4 per service |
| 7 | Redis Cache for Gateway | GET request caching |
| 8 | Round Robin Load Balancing | In-code implementation |
| 9 | Prometheus + Grafana | Scrapes gateway + 6 replicas |
| 10 | Dockerize everything | Single docker-compose.yml |
| 11 | Swagger/Postman collection | OpenAPI + Postman in /docs |

## Project Structure

```
├── docker-compose.yml          # Main orchestration
├── gateway/                    # Python FastAPI Gateway
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── auth.py            # JWT authentication
│   │   ├── load_balancer.py   # Round Robin implementation
│   │   ├── cache.py           # Redis caching
│   │   └── proxy.py           # Request forwarding
│   └── Dockerfile
├── services/
│   ├── marketplace/           # Node.js + MongoDB
│   │   ├── src/
│   │   │   ├── models/        # Mongoose schemas
│   │   │   ├── controllers/   # Business logic
│   │   │   └── routes/        # API routes
│   │   └── Dockerfile
│   └── discourse/             # Node.js + PostgreSQL
│       ├── src/
│       │   ├── models/        # Sequelize models
│       │   ├── controllers/   # Business logic
│       │   └── routes/        # API routes
│       └── Dockerfile
├── frontend/                   # React demo application
├── monitoring/                 # Prometheus + Grafana configs
└── docs/                       # OpenAPI spec + Postman collection
```

## Testing the System

```bash
# 1. Register a user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'

# 2. Login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}' | jq -r '.token')

# 3. Create a marketplace item
curl -X POST http://localhost:8000/marketplace/item \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Asset", "description": "A test item", "category": "asset", "price": 100}'

# 4. List items (observe caching on repeated calls)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/marketplace/list

# 5. Create a discourse channel
curl -X POST http://localhost:8000/discourse/channel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Economics Discussion", "type": "public"}'

# 6. Check gateway status (shows cache and load balancer stats)
curl http://localhost:8000/status
```

## Monitoring

1. Open Grafana at http://localhost:3004 (admin/admin)
2. Navigate to the "Capitalism Simulation - System Overview" dashboard
3. Observe:
   - Service health status
   - Request rates per service
   - Cache hit/miss ratio
   - Load balancer distribution across replicas
   - Latency percentiles (P50, P90, P99)

## Technologies

- **Gateway**: Python 3.11, FastAPI, Redis, PyJWT
- **Services**: Node.js 18, Express, Mongoose, Sequelize
- **Databases**: MongoDB 6, PostgreSQL 15
- **Monitoring**: Prometheus, Grafana
- **Frontend**: React 18, Material-UI
- **Orchestration**: Docker Compose
