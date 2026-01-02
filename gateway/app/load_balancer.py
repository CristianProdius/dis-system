import threading
from typing import List, Dict

class RoundRobinLoadBalancer:
    def __init__(self, service_name: str, replicas: List[str]):
        self.service_name = service_name
        self.replicas = replicas
        self.current_index = 0
        self.lock = threading.Lock()
        self.request_counts: Dict[str, int] = {replica: 0 for replica in replicas}

    def get_next(self) -> str:
        with self.lock:
            if not self.replicas:
                raise ValueError(f"No replicas available for {self.service_name}")

            replica = self.replicas[self.current_index]
            self.request_counts[replica] += 1
            self.current_index = (self.current_index + 1) % len(self.replicas)
            return replica

    def get_stats(self) -> Dict[str, int]:
        with self.lock:
            return dict(self.request_counts)

    def get_replica_count(self) -> int:
        return len(self.replicas)


class LoadBalancerManager:
    def __init__(self):
        self.load_balancers: Dict[str, RoundRobinLoadBalancer] = {}

    def register_service(self, service_name: str, replicas: List[str]):
        self.load_balancers[service_name] = RoundRobinLoadBalancer(service_name, replicas)

    def get_next_replica(self, service_name: str) -> str:
        if service_name not in self.load_balancers:
            raise ValueError(f"Service {service_name} not registered")
        return self.load_balancers[service_name].get_next()

    def get_all_stats(self) -> Dict[str, Dict[str, int]]:
        return {
            name: lb.get_stats()
            for name, lb in self.load_balancers.items()
        }


lb_manager = LoadBalancerManager()
