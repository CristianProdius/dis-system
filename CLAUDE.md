# Capitalism Simulation - Distributed Systems MVP

## Project Overview

**Course:** FAF.PAD 21.1 Autumn 2025
**Assignment:** Topic 10 - Capitalism Simulation
**Architecture:** Microservices with API Gateway

This project implements a distributed capitalism simulation system with two core microservices communicating through a Python API Gateway.

---

## Architecture Diagram

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                     MONITORING                               │
                                    │  ┌─────────────┐         ┌─────────────┐                    │
                                    │  │ Prometheus  │◄────────│   Grafana   │                    │
                                    │  └──────┬──────┘         └─────────────┘                    │
                                    │         │ scrapes /metrics                                   │
                                    └─────────┼───────────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
┌──────────┐   ┌─────────────────────────────────────────────────────────────────┐
│          │   │                    API GATEWAY (Python FastAPI)                  │
│  CLIENT  │──►│  ┌─────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│          │   │  │  Redis  │  │  Round Robin LB  │  │  Request Routing       │  │
└──────────┘   │  │  Cache  │  │  (in-code impl)  │  │  /marketplace/* → S1   │  │
               │  └─────────┘  └──────────────────┘  │  /discourse/*   → S2   │  │
               │                                      └────────────────────────┘  │
               └───────────────────────┬──────────────────────┬──────────────────┘
                                       │                      │
              ┌────────────────────────┼──────────────────────┼────────────────────┐
              │                        │                      │                    │
              ▼                        ▼                      ▼                    ▼
┌─────────────────────────────────────────────┐  ┌─────────────────────────────────────────────┐
│      MARKETPLACE SERVICE (Node.js x3)       │  │       DISCOURSE SERVICE (Node.js x3)        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │Replica 1│ │Replica 2│ │Replica 3│       │  │  │Replica 1│ │Replica 2│ │Replica 3│       │
│  │ :3001   │ │ :3002   │ │ :3003   │       │  │  │ :4001   │ │ :4002   │ │ :4003   │       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │  │  └────┬────┘ └────┬────┘ └────┬────┘       │
│       │           │           │             │  │       │           │           │             │
│       └───────────┴───────────┘             │  │       └───────────┴───────────┘             │
│                   │                         │  │                   │                         │
│                   ▼                         │  │                   ▼                         │
│          ┌────────────────┐                 │  │          ┌────────────────┐                 │
│          │    MongoDB     │                 │  │          │   PostgreSQL   │                 │
│          │   (separate)   │                 │  │          │   (separate)   │                 │
│          └────────────────┘                 │  │          └────────────────┘                 │
└─────────────────────────────────────────────┘  └─────────────────────────────────────────────┘
```

---

## Services Specification

### Service 1: Free Market Exchange Service (Marketplace)

**Technology Stack:**
- Runtime: Node.js 18+
- Framework: Express.js
- Database: MongoDB
- Port Range: 3001-3003 (3 replicas)

**Domain Model:**

```javascript
// MarketplaceItem
{
  _id: ObjectId,
  name: String,           // Item/asset name
  description: String,    // Detailed description
  category: String,       // 'asset' | 'innovation' | 'service' | 'knowledge'
  price: Number,          // Current market price
  currency: String,       // 'USD' | 'EUR' | 'BTC' | 'GOLD'
  sellerId: String,       // Owner/seller ID
  status: String,         // 'available' | 'sold' | 'reserved'
  isPremium: Boolean,     // Premium listing flag
  tags: [String],         // Searchable tags
  createdAt: Date,
  updatedAt: Date
}

// Transaction
{
  _id: ObjectId,
  itemId: ObjectId,
  buyerId: String,
  sellerId: String,
  price: Number,
  currency: String,
  type: String,           // 'purchase' | 'investment' | 'trade'
  status: String,         // 'pending' | 'completed' | 'failed'
  createdAt: Date
}
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/marketplace/list` | List all marketplace items with filtering |
| GET | `/marketplace/item/{id}` | Get specific item details |
| POST | `/marketplace/item` | Create new marketplace listing |
| POST | `/marketplace/purchase` | Purchase an item |
| GET | `/status` | Service health check |
| GET | `/metrics` | Prometheus metrics |

**Business Logic:**
1. **List Items** - Filter by category, price range, currency, status
2. **Get Item** - Retrieve item with seller info and transaction history
3. **Create Listing** - Validate pricing, set initial status, assign seller
4. **Purchase** - Verify availability, create transaction, update status

---

### Service 2: Communication & Discourse Service

**Technology Stack:**
- Runtime: Node.js 18+
- Framework: Express.js
- Database: PostgreSQL
- Port Range: 4001-4003 (3 replicas)

**Domain Model:**

```sql
-- channels table
CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,      -- 'public' | 'private' | 'sovereign'
  zone VARCHAR(100),              -- Economic/philosophical zone
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id),
  author_id VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  topic VARCHAR(100),             -- 'economic' | 'philosophical' | 'strategic'
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/discourse/channels` | List all accessible channels |
| GET | `/discourse/channel/{id}` | Get channel details with posts |
| POST | `/discourse/channel` | Create new channel |
| POST | `/discourse/post` | Create post in a channel |
| GET | `/status` | Service health check |
| GET | `/metrics` | Prometheus metrics |

**Business Logic:**
1. **List Channels** - Filter by type (public/private/sovereign), zone
2. **Get Channel** - Retrieve channel with paginated posts
3. **Create Channel** - Validate type, set creator, initialize settings
4. **Create Post** - Validate channel access, categorize topic, store content

---

## API Gateway Specification

**Technology Stack:**
- Language: Python 3.11+
- Framework: FastAPI
- Cache: Redis
- Authentication: JWT (PyJWT + passlib)
- Port: 8000

**Features:**

### 0. JWT Authentication

```python
# Auth endpoints handled directly by gateway
POST /auth/register  # Create user (stored in Redis)
POST /auth/login     # Validate credentials, return JWT token

# Protected endpoints require: Authorization: Bearer <token>
# User ID extracted from JWT and passed to services via X-User-Id header
```

### 1. Round Robin Load Balancer (In-Code Implementation)

```python
class RoundRobinLoadBalancer:
    def __init__(self, service_name: str, replicas: List[str]):
        self.service_name = service_name
        self.replicas = replicas
        self.current_index = 0
        self.lock = threading.Lock()

    def get_next_replica(self) -> str:
        with self.lock:
            replica = self.replicas[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.replicas)
            return replica
```

### 2. Redis Caching Strategy

```python
# Cache GET requests only
CACHE_TTL = 60  # seconds

# Cached endpoints:
# - GET /marketplace/list
# - GET /marketplace/item/{id}
# - GET /discourse/channels
# - GET /discourse/channel/{id}

# Cache key format: "cache:{method}:{path}:{query_hash}"
```

### 3. Gateway Routes

| Gateway Route | Target Service | Auth | Description |
|---------------|----------------|------|-------------|
| `POST /auth/register` | gateway (internal) | No | Register new user |
| `POST /auth/login` | gateway (internal) | No | Login, get JWT token |
| `GET /marketplace/list` | marketplace:3001-3003 | Yes | List items (cached) |
| `GET /marketplace/item/{id}` | marketplace:3001-3003 | Yes | Get item (cached) |
| `POST /marketplace/item` | marketplace:3001-3003 | Yes | Create listing |
| `POST /marketplace/purchase` | marketplace:3001-3003 | Yes | Purchase item |
| `GET /discourse/channels` | discourse:4001-4003 | Yes | List channels (cached) |
| `GET /discourse/channel/{id}` | discourse:4001-4003 | Yes | Get channel (cached) |
| `POST /discourse/channel` | discourse:4001-4003 | Yes | Create channel |
| `POST /discourse/post` | discourse:4001-4003 | Yes | Create post |

---

## Monitoring Specification

### Prometheus Configuration

**Scrape Targets:**
- Gateway: `gateway:8000/metrics`
- Marketplace replicas: `marketplace-1:3001/metrics`, `marketplace-2:3002/metrics`, `marketplace-3:3003/metrics`
- Discourse replicas: `discourse-1:4001/metrics`, `discourse-2:4002/metrics`, `discourse-3:4003/metrics`

**Key Metrics:**
- `http_requests_total` - Total HTTP requests by endpoint
- `http_request_duration_seconds` - Request latency histogram
- `service_up` - Service health status
- `cache_hits_total` / `cache_misses_total` - Redis cache performance

### Grafana Dashboard (Detailed)

**Dashboard Panels:**
1. **Service Health** - Up/down status for all 7 scrape targets (gateway + 6 replicas)
2. **Request Rate** - Requests per second by service and endpoint
3. **Error Rate** - 4xx/5xx responses percentage
4. **Latency Percentiles** - P50, P90, P99 response times histogram
5. **Cache Performance** - Hit ratio, hits vs misses over time
6. **Load Balancer Distribution** - Requests per replica (pie chart showing round-robin balance)
7. **Per-Endpoint Breakdown** - Table with method, path, count, avg latency
8. **Active Connections** - Concurrent connections per service

---

## Docker Compose Structure

```yaml
services:
  # Frontend Demo Application
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [gateway]
    environment:
      - REACT_APP_API_URL=http://localhost:8000

  # API Gateway
  gateway:
    build: ./gateway
    ports: ["8000:8000"]
    depends_on: [redis, marketplace-1, discourse-1]
    environment:
      - MARKETPLACE_REPLICAS=marketplace-1:3001,marketplace-2:3002,marketplace-3:3003
      - DISCOURSE_REPLICAS=discourse-1:4001,discourse-2:4002,discourse-3:4003
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key-here

  # Marketplace Service (3 replicas)
  marketplace-1:
    build: ./services/marketplace
    ports: ["3001:3001"]
    environment:
      - PORT=3001
      - MONGODB_URI=mongodb://mongo-marketplace:27017/marketplace
      - INSTANCE_ID=marketplace-1

  marketplace-2:
    build: ./services/marketplace
    ports: ["3002:3002"]
    environment:
      - PORT=3002
      - MONGODB_URI=mongodb://mongo-marketplace:27017/marketplace
      - INSTANCE_ID=marketplace-2

  marketplace-3:
    build: ./services/marketplace
    ports: ["3003:3003"]
    environment:
      - PORT=3003
      - MONGODB_URI=mongodb://mongo-marketplace:27017/marketplace
      - INSTANCE_ID=marketplace-3

  # Discourse Service (3 replicas)
  discourse-1:
    build: ./services/discourse
    ports: ["4001:4001"]
    environment:
      - PORT=4001
      - DATABASE_URL=postgres://postgres:password@postgres-discourse:5432/discourse
      - INSTANCE_ID=discourse-1

  discourse-2:
    build: ./services/discourse
    ports: ["4002:4002"]
    environment:
      - PORT=4002
      - DATABASE_URL=postgres://postgres:password@postgres-discourse:5432/discourse
      - INSTANCE_ID=discourse-2

  discourse-3:
    build: ./services/discourse
    ports: ["4003:4003"]
    environment:
      - PORT=4003
      - DATABASE_URL=postgres://postgres:password@postgres-discourse:5432/discourse
      - INSTANCE_ID=discourse-3

  # Databases (separate per service)
  mongo-marketplace:
    image: mongo:6
    volumes: [mongo-marketplace-data:/data/db]

  postgres-discourse:
    image: postgres:15
    environment:
      - POSTGRES_DB=discourse
      - POSTGRES_PASSWORD=password
    volumes: [postgres-discourse-data:/var/lib/postgresql/data]

  # Caching
  redis:
    image: redis:7-alpine

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes: [./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml]
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana:latest
    ports: ["3001:3000"]  # Note: 3001 to avoid conflict with frontend
    volumes: [./monitoring/grafana:/etc/grafana/provisioning]

volumes:
  mongo-marketplace-data:
  postgres-discourse-data:
```

---

## Directory Structure

```
/
├── CLAUDE.md                           # This specification file
├── docker-compose.yml                  # Main orchestration file
├── README.md                           # Project documentation
│
├── gateway/                            # Python API Gateway
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application
│   │   ├── auth.py                     # JWT authentication
│   │   ├── config.py                   # Configuration
│   │   ├── load_balancer.py            # Round Robin implementation
│   │   ├── cache.py                    # Redis caching logic
│   │   ├── proxy.py                    # Request forwarding
│   │   └── metrics.py                  # Prometheus metrics
│   └── tests/
│
├── services/
│   ├── marketplace/                    # Node.js Marketplace Service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.js                # Express app entry
│   │   │   ├── config.js               # Configuration
│   │   │   ├── routes/
│   │   │   │   └── marketplace.js      # API routes
│   │   │   ├── controllers/
│   │   │   │   └── marketplaceController.js
│   │   │   ├── models/
│   │   │   │   ├── Item.js
│   │   │   │   └── Transaction.js
│   │   │   ├── services/
│   │   │   │   └── marketplaceService.js
│   │   │   └── metrics.js              # Prometheus metrics
│   │   └── tests/
│   │
│   └── discourse/                      # Node.js Discourse Service
│       ├── Dockerfile
│       ├── package.json
│       ├── src/
│       │   ├── index.js                # Express app entry
│       │   ├── config.js               # Configuration
│       │   ├── routes/
│       │   │   └── discourse.js        # API routes
│       │   ├── controllers/
│       │   │   └── discourseController.js
│       │   ├── models/
│       │   │   ├── Channel.js
│       │   │   └── Post.js
│       │   ├── services/
│       │   │   └── discourseService.js
│       │   ├── migrations/             # PostgreSQL migrations
│       │   └── metrics.js              # Prometheus metrics
│       └── tests/
│
├── frontend/                           # React Demo Application
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx               # JWT login form
│   │   │   ├── Register.jsx            # User registration
│   │   │   ├── Marketplace.jsx         # Marketplace UI
│   │   │   ├── Discourse.jsx           # Discourse/forums UI
│   │   │   └── Dashboard.jsx           # Overview dashboard
│   │   ├── services/
│   │   │   └── api.js                  # API client with JWT
│   │   └── components/
│   └── public/
│
├── monitoring/
│   ├── prometheus.yml                  # Prometheus configuration
│   └── grafana/
│       ├── dashboards/
│       │   └── system-overview.json
│       └── provisioning/
│           ├── dashboards/
│           │   └── dashboard.yml
│           └── datasources/
│               └── datasource.yml
│
└── docs/
    ├── openapi.yaml                    # OpenAPI 3.0 specification
    └── postman_collection.json         # Postman collection
```

---

## Requirements Checklist

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | 2 different languages | Python (Gateway), Node.js (Services) |
| 2 | 2 services with 3 replicas each | marketplace-1/2/3, discourse-1/2/3 |
| 3 | 4+ business logic endpoints per service | 4 each + status endpoint |
| 4 | Separated database per service | MongoDB (Marketplace), PostgreSQL (Discourse) |
| 5 | Gateway in different language | Python FastAPI gateway |
| 6 | Gateway proxies 8 business endpoints | 4 per service via gateway routes |
| 7 | Redis Cache for Gateway | GET request caching with TTL |
| 8 | Round Robin Load Balancing | In-code implementation in gateway |
| 9 | Prometheus + Grafana | Scrapes all 7 services (gateway + 6 replicas) |
| 10 | Dockerize everything | Single docker-compose.yml |
| 11 | Swagger/Postman collection | OpenAPI spec + Postman collection |
| 12 | JWT Authentication | Gateway handles auth, passes user ID to services |

---

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access services
# Frontend Demo: http://localhost:3000
# Gateway API: http://localhost:8000
# Gateway Docs: http://localhost:8000/docs (FastAPI auto-generated)
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)

# Test API endpoints (requires JWT token)
# 1. Register a user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'

# 2. Login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}' | jq -r '.token')

# 3. Access protected endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/marketplace/list
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/discourse/channels
```

---

## Development Commands

```bash
# Build services
docker-compose build

# Start specific service
docker-compose up gateway marketplace-1

# Scale (for testing, though we use explicit replicas)
docker-compose up -d --scale marketplace=3

# View metrics
curl http://localhost:8000/metrics
curl http://localhost:3001/metrics

# Stop all
docker-compose down -v
```
