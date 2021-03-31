# Redis HA with standalone

- 제안배경
  - Redis 를 HA 로 구성하기 위해서는 cluster 나 sentinel 구성을 필요로 함
  - cluster 나 sentinel 구성은 복잡한 구조와 기본 3개 이상의 인스턴스가 필요
- Redis standalone HA 구성
  - Redis standalone 구성만으로 HA 구성을 검토
  - 개별 Redis 간 Data Sync 를 위해 side-car, envoy proxy, redis proxy 등을 검토


## Standalone + Sidecar

- Redis Master-Master HA 구성 방안
- 각 Redis Standalone service 에 Sidecar 를 구성하여 Replication 이 가능한지 검토
  - Dynomite, Envoy etc.

### Netflix Dynomite

#### Introduction

Dynomite 는 다양한 key-value pair 스토리지 엔진을 Amazon DynamoDB와 유사하게 구현할 수 있다. 현재 Redis 및 Memcached 등에 사용 가능하다. Dynomite는 multi-datacenter replication 을 지원하며, 고 가용성을 위한 설계가 적용되어 있다.  

Dynomite 의 궁극적인 목표는 본질적으로 해당 기능을 제공하지 않는 스토리지 엔진에서 고 가용성 및 cross-datacenter replication 을 구현할 수 있도록 하는 것이다.

> Dynomite Github Wiki 참조
<https://github.com/Netflix/dynomite/wiki>
> Amazon DynamoDB Docs
<https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/Introduction.html>

#### Architecture Overview

- Replication Flow

  - On-premise 환경이라 가정할 때, Dynomite와 Target 스토리지 엔진은 동일한 노드에서 실행되며, Client 는 Dynomite 에 Request.
  - 해당 Request 는 동일한 노드의 스토리지 엔진 또는 다른 노드에서 실행되는 Dynomite 프로세스로 proxy.
  - Request 가 Dynomite Node 를 통과하면, data 가 복제되어 대상 스토리지에 저장됨.
  - 이후, Client 는 Dynomite 혹은 스토리지의 API Call 을 통하여, 데이터를 다시 조회.

<img src="https://github.com/Netflix/dynomite/wiki/images/dynomite-architecture.png" width="800px" height="450px" title="dynomite-arch" alt="dynomite-arch"></img>

> Dynomite Architecture 참조
<https://github.com/Netflix/dynomite/wiki/Architecture>


#### 구성 Architecture

Kubernetes 환경에서 제공되는 Redis Standalone 서비스의 고 가용성 확보를 위한 구성 방안
: Dynomite Sidecar 를 통한 datacenter replication

- Redis Standalone + Dynomite Sidecar Deployment
  - 각 Redis Deployment 를 component로 묶어서 공통으로 request 를 처리할 수 있는 service 생성
  - Client 는 common service 에 request.
  - common service 에서 각 dynomite pod 에 Load Balancing.
  - dynomite pod 에서 write 작업 요청 시, target redis 에 write 를 수행하고, dynomite seed 에 설정된 pod 으로 proxy.
  - proxy 요청을 받은 dynomite 또한, 자신의 target redis 에 write 를 수행
  - <u>*dynomite 에서 target redis 에 request 할 때, 각 redis 별로 생성된 k8s service 를 통하여 호출 (아래 그림에서는 각 service 생략)*</u>

@startuml
"Client" as client
node "EKS" as eks {
  [common-service] as commserv
  node "Redis HA" as db {
    rectangle "redis-002" as db002 {
      database "redis" as redis002
      (dynomite) as car002
    }
    rectangle "redis-001" as db001 {
      database "redis" as redis001
      (dynomite) as car001
    }
  }
}
node "EFS" as efs {
  storage "NFS Storage" as nfs
}
client -> commserv
commserv -down-> car001
commserv -down-> car002
car001 -down-> redis001
car002 -down-> redis002
car001 <-> car002
redis001 -down- nfs
redis002 -down- nfs
@enduml

#### 구성 내역

- Redis Standalone + Dynomite Sidecar Deployment

```yaml
...

    spec:
      #hostNetwork: true
      containers:
      - name: redis-dyno-001
        image: redis:latest
        imagePullPolicy: IfNotPresent
        ports:
          - containerPort: 6379
        command: 
          - redis-server
          - "/redis-master/redis.conf"
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 300m
            memory: 256Mi
        volumeMounts:
        - name: shared-storage
          mountPath: /data
        - name: redis-config
          mountPath: /redis-master
      - name: dynomite
        image: dynomitedb/dynomite
        imagePullPolicy: IfNotPresent
        securityContext:
          runAsUser: 999
          runAsGroup: 999
        ports:
          - containerPort: 8101
            name: dyno
          - containerPort: 8102
            name: dyno-client
          - containerPort: 22222
            name: dyno-admin
        args: ["dynomite", "-c", "/etc/dynomitedb/conf/dynomite.yaml"]
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 300m
            memory: 256Mi
        volumeMounts:
        - name: dyno-config
          mountPath: /etc/dynomitedb/conf

...
```

- Dynomite target server 및 seed 구성 내역 (dynomite.yaml)

```yaml
dyn_o_mite:
  datacenter: dc1
  rack: rack1
  dyn_listen: 0.0.0.0:8101
  listen: 0.0.0.0:8102
  dyn_seeds:
  - redis-dyno-002:8101:rack2:dc2:0 # proxy 대상이되는 dynomite seed
  servers:
  - redis-dyno-001:6379:1 # read/write target 이 되는 redis server
  tokens: '0'
  data_store: 0
  pem_key_file: /etc/dynomitedb/dynomite.pem
  secure_server_option: none
  read_consistency: DC_QUORUM # DC_ONE / DC_QUORUM
  write_consistency: DC_QUORUM
```

### Envoy Redis Proxy

#### Introduction

Envoy는 대규모의 현대적인 서비스 지향 아키텍처를 위해 설계된 L7 Proxy 및 Communication bus 이며, Service Mesh 를 구성하는 데에 활용. 많은 기능 중에서 Redis Proxy 의 request mirroring 을 통한 replication 및 고 가용성 확보 방안을 검토.

Envoy는 Redis Proxy 로 동작하여 cluster의 인스턴스간에 명령을 분할 할 수 있다. 이 모드에서 Envoy의 목표는 일관성보다는 가용성과 파티션 허용성을 유지하는 것이다. 또한, 액세스 패턴, 제거 또는 격리 요구 사항에 따라 서로 다른 워크로드에서 서로 다른 upstream cluster 로 routing 명령을 지원함.

> Envoy Redis Proxy Overview 참조
<https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_protocols/redis.html>

#### Architecture Overview

- Request Flow

  - Envoy Redis Proxy 에서 내부 구조는 크게 Listener / Cluster 로 구분할 수 있음.
  - Listener 에서 Request 를 요청 받기 위한 socket address 를 정의하며, 이를 통해 request 를 수신
  - Listner 내부에 filter 를 정의하여, request 의 routing policy 를 설정
  - 위의 routing target 은, Envoy 에서 정의한 clusters 중의 하나로 혹은 그 이상으로 설정 가능
  - Redis Proxy 의 경우, cluster 에 target 이 되는 redis server / cluster 를 정의할 수 있음

-  HTTP router filter 예시
<img src="https://www.envoyproxy.io/docs/envoy/latest/_images/lor-architecture.svg" width="800px" height="450px" title="envoy-arch" alt="envoy-arch"></img>

> Envoy Life of Request 참조
<https://www.envoyproxy.io/docs/envoy/latest/intro/life_of_a_request#>


#### 구성 Architecture

Kubernetes 환경에서 제공되는 Redis Standalone 서비스의 고 가용성 확보를 위한 구성 방안
: Envoy Redis Proxy Sidecar 를 통한 request mirroring

@startuml
"Client" as client
node "EKS" as eks {
  [common-service] as commserv
  node "Redis HA" as db {
    rectangle "redis-002" as db002 {
      database "redis" as redis002
      (envoy) as car002
    }
    rectangle "redis-001" as db001 {
      database "redis" as redis001
      (envoy) as car001
    }
  }
}
node "EFS" as efs {
  storage "NFS Storage" as nfs
}
client -> commserv
commserv -down-> car001
commserv -down-> car002
car001 -down-> redis001
car002 -down-> redis002
car001 --> redis002
car002 --> redis001
redis001 -down- nfs
redis002 -down- nfs
@enduml


#### 구성 내역


## Proxy Mirroring
### Architecture
### Envoy Redis Proxy
#### request mirroring
#### cluster 단위 활용
### 기타 활용
#### prefix 활용 및 sharding


## 성능 테스트
### Redis Benchmark
### Application 연동 Test


root@redis-cache-c5b8bb44d-5pkfr:/data# redis-benchmark -q -t get,set,lpush,lpop
SET: 22036.14 requests per second, p50=0.311 msec
GET: 20815.99 requests per second, p50=0.319 msec
LPUSH: 19646.37 requests per second, p50=0.335 msec
LPOP: 20842.02 requests per second, p50=0.319 msec

root@redis-cache-001-58c7bfdd9b-brtnm:/redis-6.2.1# redis-benchmark -p 6380 -q -t get,set,lpop,lpush
SET: 9100.01 requests per second, p50=0.767 msec
GET: 11132.14 requests per second, p50=0.727 msec
LPUSH: 9426.85 requests per second, p50=0.823 msec
LPOP: 9912.77 requests per second, p50=0.839 msec


root@redis-cache-001-768b5bfb77-lvrjx:/data# redis-benchmark -q -t get,set,lpop,lpush
SET: 20815.99 requests per second, p50=0.311 msec
GET: 20370.75 requests per second, p50=0.327 msec
LPUSH: 21781.75 requests per second, p50=0.303 msec
LPOP: 21810.25 requests per second, p50=0.295 msec


dynomite@redis-cache-001-768b5bfb77-lvrjx:/$ redis-benchmark -p 8102 -q -t get,set,lpop,lpush
SET: 14830.19 requests per second, p50=0.887 msec
GET: 19623.23 requests per second, p50=0.583 msec
LPUSH: 14898.69 requests per second, p50=0.879 msec
LPOP: 14909.80 requests per second, p50=0.879 msec
