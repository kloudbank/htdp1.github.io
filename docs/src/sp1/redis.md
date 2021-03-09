# Redis 성능 Test

## Prerequisite
- EKS에 nGrider Controller Deploy
<https://github.com/htdp1/session-k8s/tree/main/dev/ngrinder/controller>
- EKS에 nGrider Agent Deploy
<https://github.com/htdp1/session-k8s/tree/main/dev/ngrinder/agent>

- Prometheus, Grafana 를 통한 EKS Cluster Monitoring
<http://k8s-grafana-grafana-6380e9e544-711314603.ap-northeast-2.elb.amazonaws.com/?orgId=1>

## Redis-Benchmark Test Result

- aof:no
```
SET: 4561.00 requests per second
GET: 4462.89 requests per second
LPUSH: 4665.70 requests per second
LPOP: 4375.98 requests per second
```

- aof:yes, aofsync:everysec
```
SET: 3772.16 requests per second
GET: 3939.80 requests per secondd
LPUSH: 4171.19 requests per second
LPOP: 5430.65 requests per second
```

- aof:yes, aofsync:always
```
SET: 2927.74 requests per second
GET: 4188.31 requests per second
LPUSH: 3165.06 requests per second
LPOP: 3165.36 requests per second
```

## nGrinder Test Result
- TPS 3000 이상의 성능이 나오는 적정 환경에서 수행

Container   | CPU       | Memory
------------|-----------|-----------
Spring Boot | 0.5 / 4   | 4Gi
nGrinder    | 0.5 / 2   | 4Gi
Redis       | 0.3 / 0.5 | 512Gi

- nGrinder Management Console에서 Test Result 조회 가능
<http://k8s-sessiond-ngrinder-aa75db0c27-1345478526.ap-northeast-2.elb.amazonaws.com/>

### Cache용 Redis SET Test

vUser   | Threshold | Replicas  | TPS | Err.   | Comment
--------|-----------|-----------|-----|--------|-------------
1000    | 2min   | 1 | **3200** | 0.0% | 
2000    | 2min   | 1 | 3100 | 0.0% | 
3000    | 2min   | 1 | 2800 | 0.1% | 성능 저하 구간으로 판단
4000    | 2min   | 1 | 2500 | 1.3% | 
3000    | 2min   | 2 | 2300 | 0.1% | 성능 저하 구간에서 replicas=2<br/>pod 여러 개일 경우, 부하 초기에 분산 지연
3000    | 5min   | 2 | **3350** | 0.0% | TPS 분포도 안정될 때까지 측정시, TPS 증가

### AOF Redis SET Test (fsync: everysec)

vUser   | Threshold | Replicas  | TPS | Err.   | Comment
--------|-----------|-----------|-----|--------|------------
1000    | 2min   | 1 | **2400** |  0.0% |
2000    | 2min   | 1 | 2300 | 0.1% |
3000    | 2min   | 1 | 2100 | 0.1% | 성능 저하 구간으로 판단
4000    | 2min   | 1 | 2700 | 1.3% | Error 발생 시, TPS 측정이 다소 부정확한 것으로 보임
6000    | 2min   | 1 | 2700 | 2.6% | Error 발생 시, TPS 측정이 다소 부정확한 것으로 보임
3000    | 5min   | 2 | **3200** | 0.0%    | 

### AOF Redis SET Test (fsync: always)

vUser   | Threshold | Replicas  | TPS | Err.   | Comment
--------|-----------|-----------|-----|--------|------------
1000    | 2min   | 1 | **2300** | 0.0% |
2000    | 2min   | 1 | 2200 | 0.0% |
3000    | 2min   | 1 | 1900 |  0.2% | 성능 저하 구간으로 판단
4000    | 2min   | 1 | 2300 |  1.4% | Error 발생 시, TPS 측정이 다소 부정확한 것으로 보임
6000    | 2min   | 2 | 2300 |  9.9% | Error 발생 시, TPS 측정이 다소 부정확한 것으로 보임
3000    | 5min   | 2 | **3100** |  0.0% |

