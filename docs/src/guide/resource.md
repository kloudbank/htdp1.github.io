# Database

## MariaDB

### mariadb container

#### 1. mariadb 를 배포한다.
```bash
$ cd session-k8s
$ kubectl apply -k ./dev/mariadb/employees
$ kubectl apply -k ./dev/mariadb/world
```

- sample data 생성 참조 URL
  - employees
<https://dev.mysql.com/doc/employee/en/employees-installation.html>
  - world
<https://dev.mysql.com/doc/world-setup/en/world-setup-installation.html>

- Custom Image 경로
  - 필요한 data 초기화 script 및 스키마 변경 내용을 일부 적용하여, dockerhub repository에서 관리
<https://hub.docker.com/repository/docker/htdp1/mariadb-emp>
<https://hub.docker.com/repository/docker/htdp1/mariadb-world>

#### 2. Local 접속 방법
- mariadb port를 local의 각 port로 port forwarding
```bash
kubectl port-forward service/mariadb-emp 3300:3306 -n session-dev
kubectl port-forward service/mariadb-world 3301:3306 -n session-dev
```
- 혹은 container 실행하여 아래처럼 cli 로 접속
```bash
kubectl run -it --rm --image=mariadb:latest -n session-dev --restart=Never mysql-client -- mysql -h mariadb-<db name> -pskcc
```

#### 3. k8s Cluster 내부에서 접속 시
- cluster 내부에서는 아래와 같이 접속한다.
```
<db name>.session-dev.svc.cluster.local:3306
```

#### backup> Database Scheme 확인
-  mariadb-emp
```
MariaDB [(none)]> use employees;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
MariaDB [employees]> show tables;
+----------------------+
| Tables_in_employees  |
+----------------------+
| current_dept_emp     |
| departments          |
| dept_emp             |
| dept_emp_latest_date |
| dept_manager         |
| employees            |
| salaries             |
| titles               |
+----------------------+
8 rows in set (0.001 sec)
```

- mariadb-world
```
MariaDB [(none)]> use world;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
MariaDB [world]> show tables;
+-----------------+
| Tables_in_world |
+-----------------+
| city            |
| country         |
| countrylanguage |
+-----------------+
3 rows in set (0.001 sec)
```

## Redis

#### 1. Redis 를 배포한다.
```
$ cd session-k8s
$ kubectl apply -k ./dev/redis/session
$ kubectl apply -k ./dev/redis/cache
```

#### 2. Local 접속 방법
- redis port를 local의 각 port로 port forwarding
```
$ kubectl port-forward service/redis-session 7000:6379
$ kubectl port-forward service/redis-cache 7001:6379
```
- local 에서 redis-cli 로 접속하여 테스트
```
$ redis-cli -p 7000
127.0.0.1:7000> set mykey myvalue2
OK
127.0.0.1:7000> get mykey
"myvalue2"
```

#### 3. k8s Cluster 내부에서 접속 시
- cluster 내부에서는 아래와 같이 접속한다.
```
<redis name>.session-dev.svc.cluster.local:6379
```

