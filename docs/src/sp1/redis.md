# Redis 성능 측정 Test

## Prerequisite
- EKS에 nGrider Controller Deploy
<https://github.com/htdp1/session-k8s/tree/main/dev/ngrinder/controller>
- EKS에 nGrider Agent Deploy
<https://github.com/htdp1/session-k8s/tree/main/dev/ngrinder/agent>

- Prometheus, Grafana 를 통한 EKS Cluster Monitoring
<http://k8s-grafana-grafana-6380e9e544-711314603.ap-northeast-2.elb.amazonaws.com/?orgId=1>

## Redis-Benchmark

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

## nGrinder
### Environment
- TPS 3000 이상의 성능이 나오는 적정 환경에서 수행
- nGrinder Agent 2ea

Container   | CPU       | Memory
------------|-----------|-----------
Spring Boot | 0.5 / 4   | 4Gi
nGrinder    | 0.5 / 2   | 4Gi
MariaDB     | 0.5 / 1.0 | 1Gi
Redis       | 0.3 / 0.5 | 0.5Gi

- nGrinder Management Console에서 Test Result 조회 가능
<http://k8s-sessiond-ngrinder-aa75db0c27-1345478526.ap-northeast-2.elb.amazonaws.com/>

![](../../images/ngrinder-test-result.png)




### Test Result

#### 1. GET Method Call Result (mariadb vs redis cache(rdb/aof/fsync mode)

Condition        |   |    | TPS<br><small>(max cpu)</small> |  |   |   |  
-----------------|---|----|---------------------------------|--|---|---|
**vUser** | **rows** | **repl.**  |    **mariadb**   | **redis**      | **redis AOF<br>everysec** | **redis AOF<br>always**
1000      | 10       | 1          |    2600 (380m)   |    3630 (90m)  |   3600  (90m)             |     3650 (90m)         
2000      | 10       | 1          |    2600 (400m)   |    2860 (70m)  |   3000  (80m)             |     3090 (80m)         
3000      | 10       | 1          |    2210 (350m)   |    2310 (60m)  |   2440  (60m)             |     2370 (60m)         
3000      | 10       | 2          |    3270 (480m)   |    3310 (90m)  |   3230  (120m)            |     3300 (80m)         
1000      | 1000     | 1          |    180  (110m)   |    1620 (130m) |   1560  (80m)             |     1580 (80m)         

##### 1-1. Mariadb Select Test

vUser   | rows    | Threshold | Replicas  | TPS |   Err.    | Comment
--------|---------|-----------|-----------|-----|--------   |-------------
1000    | 10      | 2min      | 1         | **2600** | 0.0% | 
2000    | 10      | 2min      | 1         | 2600     | 0.0% | 
3000    | 10      | 2min      | 1         | 2210     | 0.1% | 성능 저하 구간으로 판단
3000    | 10      | 5min      | 2         | 3270     | 0.0% | pod 증설, *2210 -> 3270*
1000    | 1000    | 2min      | 1         | **180**  | 0.0% | rows 증가, *2600 -> 180*

##### 1-2. Redis GET Test

vUser   | rows    | Threshold | Replicas  | TPS |   Err.    | Comment
--------|---------|-----------|-----------|-----|--------   |-------------
1000    | 10      | 2min      | 1         | **3630** | 0.0% | 
2000    | 10      | 2min      | 1         | 2860     | 0.0% | 
3000    | 10      | 2min      | 1         | 2310     | 0.9% | 성능 저하 구간으로 판단
3000    | 10      | 5min      | 2         | 3310     | 0.0% | pod 증설, *2310 -> 3320*
1000    | 1000    | 2min      | 1         | **1620** | 0.0% | rows 증가, *3630 -> 1620*

##### 1-3. AOF Redis GET Test (fsync: everysec)

vUser   | rows    | Threshold | Replicas  | TPS |   Err.    | Comment
--------|---------|-----------|-----------|-----|--------   |-------------
1000    | 10      | 2min      | 1         | **3600** | 0.0% | 
2000    | 10      | 2min      | 1         | 3000     | 0.0% | 
3000    | 10      | 2min      | 1         | 2440     | 0.1% | 성능 저하 구간으로 판단
3000    | 10      | 5min      | 2         | 3230     | 0.0% | pod 증설, *2440 -> 3230*
1000    | 1000    | 2min      | 1         | **1560** | 0.0% | rows 증가, *3600 -> 1560*

##### 1-4. AOF Redis GET Test (fsync: always)

vUser   | rows    | Threshold | Replicas  | TPS |   Err.    | Comment
--------|---------|-----------|-----------|-----|--------   |-------------
1000    | 10      | 2min      | 1         | **3650** | 0.0% | 
2000    | 10      | 2min      | 1         | 3090     | 0.0% | 
3000    | 10      | 2min      | 1         | 2370     | 0.1% | 성능 저하 구간으로 판단
3000    | 10      | 5min      | 2         | 3300     | 0.0% | pod 증설, *2370 -> 3300*
1000    | 1000    | 2min      | 1         | **1580** | 0.0% | rows 증가, *3650 -> 1580*


#### 2. POST Method Call Test

Condition |            | TPS<br><small>(max cpu)</small> |  |   |   |  
----------|----        |---------------------------------|--|---|---|
**vUser** | **repl.**  |  **mariadb**   |   **redis**       | **redis AOF<br>everysec** | **redis AOF<br>always**
1000      | 1          |   1550 (980m)  |  **3170 (150m)**  |   2410 (150m)             |     2300 (70m)          
2000      | 1          |   1530 (980m)  |  **3270 (160m)**  |   2310 (130m)             |     2200 (100m)          
3000      | 1          |   1370 (970m)  |  **2840 (160m)**  |   2100 (130m)             |     1900 (90)          
3000      | 2          |   1940 (970m)  |  **3350 (220m)**  |   3260 (270m)             |     3140 (180m)          


##### 2-1. Mariadb Insert Test

vUser   | Threshold | Replicas  | TPS | Err.   | Comment
--------|-----------|-----------|-----|--------|-------------
1000    | 2min      | 1         | **1550** | 0.0% | 
2000    | 2min      | 1         | 1530     | 0.0% | 
3000    | 2min      | 1         | 1370     | 1.0% | 성능 저하 구간으로 판단
4000    | 2min      | 1         | 1350     | 1.2% | 
3000    | 5min      | 2         | **1940** | 0.1% | Pod 증설, *1370 -> 1940* 

##### 2-2. Redis SET Test

vUser   | Threshold | Replicas  | TPS | Err.   | Comment
--------|-----------|-----------|-----|--------|-------------
1000    | 2min      | 1         | **3170** | 0.0% | 
2000    | 2min      | 1         | 3270     | 0.0% | 
3000    | 2min      | 1         | 2840     | 0.1% | 성능 저하 구간으로 판단
4000    | 2min      | 1         | 2500     | 1.3% | 
3000    | 2min      | 2         | 2300     | 0.1% | 성능 저하 구간에서 replicas=2<br/>pod 여러 개일 경우, 부하 초기에 분산 지연
3000    | 5min      | 2         | **3350** | 0.0% | Pod 증설, *2840 -> 3350*

##### 2-3. AOF Redis SET Test (fsync: everysec)

vUser   | Threshold | Replicas  | TPS | Err.   | Comment
--------|-----------|-----------|-----|--------|------------
1000    | 2min      | 1         | **2400** | 0.0% |
2000    | 2min      | 1         | 2310     | 0.1% |
3000    | 2min      | 1         | 2100     | 0.1% | 성능 저하 구간으로 판단
4000    | 2min      | 1         | 2700     | 1.3% | Error 발생 시, TPS 측정이 다소 부정확한 것으로 보임
6000    | 2min      | 1         | 2700     | 2.6% | Error 발생 시, TPS 측정이 다소 부정확한 것으로 보임
3000    | 5min      | 2         | **3260** | 0.0% | Pod 증설, *2100 -> 3260*

##### 2-4. AOF Redis SET Test (fsync: always)

vUser   | Threshold | Replicas  | TPS | Err.   | Comment
--------|-----------|-----------|-----|--------|------------
1000    | 2min      | 1         | **2300** | 0.0% |
2000    | 2min      | 1         | 2200     | 0.0% |
3000    | 2min      | 1         | 1900     | 0.2% | 성능 저하 구간으로 판단
4000    | 2min      | 1         | 2300     | 1.4% | Error 발생 시, TPS 측정이 다소 부정확한 것으로 보임
6000    | 2min      | 2         | 2300     | 9.9% | Error 발생 시, TPS 측정이 다소 부정확한 것으로 보임
3000    | 5min      | 2         | **3140** | 0.0% | Pod 증설, *1900 -> 3140*
