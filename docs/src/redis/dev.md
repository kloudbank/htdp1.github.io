# Development

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

- Sample App. Repository
<https://github.com/htdp1/dept-spring>

## Spring Data REST

#### spring-boot-data-rest 를 이용한 DB table CRUD 기능
기본으로 spring-boot web project 를 생성하고 아래 작업을 진행합니다.
- spring-boot-data-rest maven dependency 추가
- application.yml 설정
- model class 생성
- repository class 생성
- spring-boot 실행 후 API 확인

#### spring-boot-data-rest maven dependency 추가
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
#### application.yml 설정
- 샘플소스는 mariadb 를 사용했으나 개별 사용중인 DB 를 사용하세요.
- application-mariadb.yml 추가
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
    ```
#### model class 생성
- table name, field name 에 맞춰서 아래 format 으로 작성합니다.
- model.Department.java
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
#### repository class 생성
- repository.DepartmentRepository.java
    ```java
    @RepositoryRestResource
    public interface DepartmentRepository extends CrudRepository<Department, String> {
    }
    ```
#### spring-boot 실행 후 API 확인
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

## Spring Data Redis Cache

#### spring-boot redis 설정
아래 작업을 진행합니다.
- sprig-boot-data-redis maven dependency 추가
- application.yml redis 설정
- redis configuration class 생성
- repository class 에 cache 적용

#### sprig-boot-data-redis maven dependency 추가
- pom.xml
    ```xml
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    ```
#### application.yml redis 설정
- application-redis.yml 파일 생성
    ```yaml
    spring: 
      cache: 
        type: redis
        redis:
        namespace: "htdp1:dept-spring:cache:" # redis key prefix
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
#### redis configuration class 생성
- config.CacheConfig.java
    ```java
    @Configuration
    @EnableCaching
    public class CacheConfig extends CachingConfigurerSupport {

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
#### repository class 에 cache 적용
- cacheManager = "cacheManager" 는 CacheConfig.java 의 @Bean(name = "cacheManager") 과 동일하게 설정
- repository.DepartmentRepository.java
    ```java
    @RepositoryRestResource
    public interface DepartmentRepository extends CrudRepository<Department, String> {
        @Override
        @Cacheable(cacheNames = "departments", key = "'findAll'", cacheManager = "cacheManager")
        Iterable<Department> findAll();
    }
    ```
