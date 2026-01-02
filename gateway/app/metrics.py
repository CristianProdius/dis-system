from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from .load_balancer import lb_manager
from .cache import cache_manager

http_requests_total = Counter(
    "gateway_http_requests_total",
    "Total HTTP requests to gateway",
    ["method", "path", "status"]
)

http_request_duration = Histogram(
    "gateway_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
    buckets=[0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5]
)

cache_hits_total = Counter(
    "gateway_cache_hits_total",
    "Total cache hits"
)

cache_misses_total = Counter(
    "gateway_cache_misses_total",
    "Total cache misses"
)

lb_requests_per_replica = Counter(
    "gateway_lb_requests_per_replica_total",
    "Requests sent to each replica",
    ["service", "replica"]
)

service_up = Gauge(
    "gateway_service_up",
    "Whether gateway is up",
    ["service"]
)

service_up.labels(service="gateway").set(1)


def update_lb_metrics():
    stats = lb_manager.get_all_stats()
    for service, replicas in stats.items():
        for replica, count in replicas.items():
            lb_requests_per_replica.labels(service=service, replica=replica)._value.set(count)


def update_cache_metrics():
    stats = cache_manager.get_stats()
    cache_hits_total._value.set(stats["hits"])
    cache_misses_total._value.set(stats["misses"])


def get_metrics():
    update_lb_metrics()
    update_cache_metrics()
    return generate_latest()


def get_content_type():
    return CONTENT_TYPE_LATEST
