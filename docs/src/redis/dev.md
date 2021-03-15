# spring-boot redis cache
spring-boot-data-rest, spring-boot-data-jpa 를 이용하여 
DB table 에 대한 CRUD 기능을 개발하고, 
spring-boot-starter-data-redis 를 사용하여 redis cache 를 적용하는 방법을 설명한다.

- Sample App. Arch. (dept-spring)
@startuml
"client"
node "EKS (ns: session-dev)" as eks {
  (ingress)
  rectangle "Redis" as redis {
    database "cache"
  }
  rectangle "MariaDB" as mariadb {
    database "departments"
  }
  rectangle "API" as api {
    [dept-spring] as dept
  }
}
client -right-> ingress
ingress -right-> dept
dept <--> departments
cache <--> dept
@enduml

## 개발환경 준비
- <https://htdp1.github.io/redis/dev.html>

## Sample App. Repository 
- <https://github.com/htdp1/dept-spring>

## spring-boot-data-rest 를 이용한 DB table CRUD 개발
우선 DB Table CRUD 기능을 개발한다.
아래 절차대로 작업을 진행한다.
- maven dependency 추가
- application.yml 설정
- model class 생성
- repository class 생성
- spring-boot 실행 후 API 확인

### maven dependency 추가
- pom.xml
    ```xml
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-rest</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.data</groupId>
        <artifactId>spring-data-rest-webmvc</artifactId>
    </dependency>
    ```

### application.yml 설정
- application-mariadb.yml 추가
    - 샘플소스는 mariadb 를 사용했으나 개별 사용중인 DB 를 사용하세요.
    ```yaml
    spring:
      datasource:
        driver-class-name: org.mariadb.jdbc.Driver
        url: jdbc:mariadb://localhost:3300/employees?characterEncoding=UTF-8
        username: root
        password: skcc
    ```
- application.yml 설정
    ```yaml
    server:
      port: 8080
      servlet:
        context-path: /dept-spring

    spring:
      config:
        import: 
        - application-mariadb.yml
      data:
        rest:
          basePath: /api
      jpa:
        properties:
          hibernate:
            format_sql: true    # jpa sql logging 시 줄바꿈을 해준다.
    
    logging:
      level:
        '[com.htdp1.deptspring]': debug
        '[org.hibernate.SQL]': debug                                # jpa sql logging
        '[org.hibernate.type.descriptor.sql.BasicBinder]': trace    # jpa sql param logging
    ```

### model class 생성
- model.Department.java
    - table name, field name 에 맞춰서 아래 format 으로 작성합니다.
    ```java
    @Entity(name = "departments")
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @Data
    public class Department {
        @Id
        @Column(name = "dept_no")
        private String deptNo;
        @Column(name = "dept_name")
        private String deptName;

        @Builder
        public Department(String deptNo, String deptName) {
            this.deptNo = deptNo;
            this.deptName = deptName;
        }
    }
    ```

### repository class 생성
- repository.DepartmentRepository.java
    - @RepositoryRestResource annotation 추가
    - CrudRepository 상속만으로 CRUD 기능이 자동으로 생성된다.
    ```java
    @RepositoryRestResource
    public interface DepartmentRepository extends CrudRepository<Department, String> {
    }
    ```

### spring-boot 실행 후 API 확인
- http://localhost:8080/dept-spring/api/
    ```json
    {
        "_links": {
            "departments": {
                "href": "http://localhost:8080/dept-spring/api/departments"
            },
            "profile": {
                "href": "http://localhost:8080/dept-spring/api/profile"
            }
        }
    }
    ```
- http://localhost:8080/dept-spring/api/departments
    ```json
    {
        "_embedded": {
            "departments": [
                {
                    "deptName": "Customer Service added",
                    "_links": {
                        "self": {
                            "href": "http://localhost:8080/dept-spring/api/departments/d009"
                        },
                        "department": {
                            "href": "http://localhost:8080/dept-spring/api/departments/d009"
                        }
                    }
                },
                {
                    "deptName": "Development",
                    "_links": {
                        "self": {
                            "href": "http://localhost:8080/dept-spring/api/departments/d005"
                        },
                        "department": {
                            "href": "http://localhost:8080/dept-spring/api/departments/d005"
                        }
                    }
                },
            ]
        },
        "_links": {
            "self": {
                "href": "http://localhost:8080/dept-spring/api/departments"
            },
            "profile": {
                "href": "http://localhost:8080/dept-spring/api/profile/departments"
            }
        }
    }
    ```

## spring-boot redis 적용 개발
DB Table CRUD 기능에 redis cache 기능을 추가한다.
아래 절차대로 작업을 진행한다.
- maven dependency 추가
- application.yml redis 설정
- redis configuration class 생성
- repository class 에 cache 적용

### maven dependency 추가
- pom.xml
    ```xml
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    ```

### application.yml redis 설정
- application-redis.yml 파일 생성
    ```yaml
    spring: 
      cache: 
        type: redis
        redis:
          namespace: "htdp1:dept-spring:cache:" # redis key name prefix
          ttl: 10                               # time to leave (min)
          host: 127.0.0.1                       # redis host
          port: 7001                            # redis port
          password:                             # redis password
    ```
- application.yml 에 import 처리
    ```yaml
    spring:
      config:
        import:
        - application-redis.yml
    ```

### redis configuration class 생성
- config.CacheConfig.java
    - application.yml 에서 redis 설정 정보를 가져온다.
    - RedisConnectionFactory 로 redis connection 을 생성한다.
    - CacheManager 에 prefix 와 ttl 을 설정한다.
    ```java
    @Configuration
    @EnableCaching
    public class CacheConfig extends CachingConfigurerSupport {
        // application.yml 에 정의된 redis 설정
        public @Value("${spring.cache.redis.host}") String host;
        public @Value("${spring.cache.redis.port}") int port;
        public @Value("${spring.cache.redis.namespace}") String namespace;
        public @Value("${spring.cache.redis.ttl}") long ttl;

        @Bean(name = "redisCacheConnectionFactory")
        public RedisConnectionFactory redisCacheConnectionFactory() {
            // redis connection cofiguration
            RedisStandaloneConfiguration redisStandaloneConfiguration = new RedisStandaloneConfiguration();
            redisStandaloneConfiguration.setHostName(host);
            redisStandaloneConfiguration.setPort(port);

            // redis connection factory
            LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(redisStandaloneConfiguration);

            return connectionFactory;
        }

        @Bean(name = "cacheManager")
        @Override
        public CacheManager cacheManager() {
            // redis cache configuration
            RedisCacheConfiguration configuration = RedisCacheConfiguration
                    .defaultCacheConfig()
                    .serializeValuesWith(RedisSerializationContext.SerializationPair
                            .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                    .prefixCacheNameWith(namespace) // cache key prefix
                    .entryTtl(Duration.ofMinutes(ttl)) // time-to-live
            ; 

            // redis cache manager
            RedisCacheManager.RedisCacheManagerBuilder builder = RedisCacheManager.RedisCacheManagerBuilder
                    .fromConnectionFactory(redisCacheConnectionFactory()) // connection factory
                    .cacheDefaults(configuration) // redis cache configuration
            ;

            return builder.build();
        }
    }
    ```

### repository class 에 cache 적용
- repository.DepartmentRepository.java
    - cache 를 적용할 interface 를 @Override 한다.
    - interface 에 @Cacheable 을 추가한다. 
        - cacheNames : cache key name
        - key : cache key
        - cacheManager : CacheConfig.java 의 @Bean(name = "cacheManager") 과 동일하게 설정한다.
    ```java
    @RepositoryRestResource
    public interface DepartmentRepository extends CrudRepository<Department, String> {
        @Override
        @Cacheable(cacheNames = "departments", key = "'findAll'", cacheManager = "cacheManager")
        Iterable<Department> findAll();

        @Cacheable(cacheNames = "departments", key = "#deptNo", cacheManager = "cacheManager")
	    Optional<Department> findById(String deptNo);
    }
    ```

### redis 에서 데이터 확인
- redis-cli 를 이용하여 redis 에 접속한다.
- redis 에 저장된 데이터를 확인한다.
    ```
    127.0.0.1:7001> keys *
    1) "htdp1:dept-spring:cache:departments::findAll"
    2) "htdp1:dept-spring:cache:departments::d009"
    ```

### Data CUD 에 대한 cache 처리 방법
- repository.DepartmentRepository.java
    - jpa 에서 create, update 는 save interface 를 사용함
    - save interface 에 @CachePut annotation 으로 cache create/update 를 처리함
    - findAll cache 의 내용을 create/update 처리는 전체 삭제 후 다시 DB에서 쿼리하도록 처리함
    - deleteById 의 경우 개별 cache 와 findAll cache 를 같이 삭제 처리함
    ```java
    @RepositoryRestResource
    public interface DepartmentRepository extends CrudRepository<Department, String> {
        @CachePut(cacheNames = "departments", key = "#department.deptNo", cacheManager = "cacheManager")
        @CacheEvict(cacheNames = "departments", key = "'findAll'", cacheManager = "cacheManager")
        <S extends Department> S save(Department department);

        @Caching(evict = { 
                @CacheEvict(cacheNames = "departments", key = "'findAll'", cacheManager = "cacheManager"),
                @CacheEvict(cacheNames = "departments", key = "#deptNo", cacheManager = "cacheManager") 
                }
        )
        void deleteById(String deptNo);
    }
    ```