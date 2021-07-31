# Mybatis

데이터 처리를 위한 방법 중 많이 사용되고 있는 mybatis 기본적인 사용법을 설명 합니다.
springboot에서는 기본적으로 하나의 datasource를 지원(auto configuration)하고 있으며,
여러개의 datasource를 사용할 경우는 프로그램에서 추가적으로 설정해줘야함
(여러개의 datasource는 별도의 app으로 분리 하는것이 더 효율적임)

## Component model

Mapper라고 하는 Interface를 선언하고 SQL과 Mapping하면 MyBatis에서 Manifest 설정 내용에 따라,
SQL Parameter를 Injection해주며, 해당 결과를 지정된 타입으로 반환해줌

Database connection 정보는 application.properties에서 설정하며, SQL과 처리 방식은
Annotation 또는 Mapper xml 파일을 통해 설정됨

@startuml
allow_mixing

circle Mapper
class ServiceA
class ServiceB
class Controller

rectangle MyBatis_Spring
rectangle jdbc
rectangle datasource
database Database

Controller --> ServiceA
Controller -right-> ServiceB
ServiceA -right-> Mapper : < ModelA
ServiceB -down-> Mapper : < ModelB
Mapper -right-> MyBatis_Spring

MyBatis_Spring --> jdbc
MyBatis_Spring --> datasource
jdbc -down-> Database
datasource -down-> Database

@enduml

## Mapper 작성

### Model(DTO) 작성
Model은 데이터를 위해 POJO를 작성.
Lombok 라이브러리를 이용하여 간편하게 작성

- DTO의 property는 DB Table의 Column 명과 동일해야함
- application.properties내 설정으로 자동변환 가능
  - mybatis.configuration.map-underscore-to-camel-case=true
  - DB column은 모통 snake case임으로 일반적인 자바 convetion인 camel case로 자동 변환
  - 주) sql 파라미터의 경우 DTO의 property 이름을 사용해야함

::: tip
DTO 작성 대신에 HashMap<String,Object> 유형을 사용하여 처리도 가능함.
:::

#### Lombok
> annotation을 이용하여, 생성자, Getter/Setter 등을 실행코드에서 자동으로 생성해줌  
> @Data Annotation은 여러가지 기능을 한번에 해결 : @Getter, @Setter, @RequiredArgsConstructor, @ToString, @EqualsAndHashCode

``` java
@Data
@NoArgsConstructor
public class EmployeeDTO {
  private Long empNo;
  private String firstName;
  private String lastName;
  private java.util.Date hireDate;
  private String birthDate;
  private String gender;
}
```

### Annotation을 이용한 방법
Mapper Interface에 Annotation을 이용하여 SQL을 작성 하는 방법  
@Select, @Insert, @Update, @Delete

::: tip
단순한 테이블단위의 쿼리를 적용할 때 용이함
:::

```java
@Mapper
public interface SamEmployeeMapper {
  @Select("select * from employees limit 1")
  List<EmployeeDTO> selectAll();
}
```

[Annotation](https://mybatis.org/mybatis-3/java-api.html)

### Mapper XML을 이용한 방법
::: tip
SQL의 내용이 복잡할 경우 가독성이 떨어져 별도 파일로 관리할 경우 유리함
:::

1. Mapper XML 파일 위치 등록: application.properties 파일에 위치 등록  
   일반적으로 src/main/resource 하위 경로를 사용.
   ``` properties
   # src/main/resource/mybatis 경로 예시
   mybatis.mapper-locations: mybatis/**/*.xml
   ```
2. Mapper interface 생성  
   interface 앞에 @Mapper를 추가함으로써 Bean 유형으로 생성됨과 동시에 SqlTemplate에 의해 동작됨
   ``` java
   package net.kubepia.sam.restapp.mybatis;
   ...
   @Mapper
   public interface SamEmployeeXmlMapper {
     List<EmployeeDTO> selectAll();
  
      List<HashMap<String, Object>> selectAllMap();
  
      EmployeeDTO findById(int id);
  
      void save(EmployeeDTO employee);
  
      void deleteEmployeeById(int id);
    }
   ```
3. Mapper 파일 생성  
   ```xml
   <!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

   <mapper namespace="net.kubepia.sam.restapp.mybatis.SamEmployeeXmlMapper">
      ...
   </mapper>
   ```
4. SQL Query 작성  
    ``` xml
    <?xml version="1.0" encoding="UTF-8"?>

    <!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

    <mapper namespace="net.kubepia.sam.restapp.mybatis.SamEmployeeXmlMapper">
        <select id="selectAll" resultType="EmployeeDTO">
            select * from employees limit 100
        </select>
        <select id="selectAllMap" resultType="java.util.HashMap">
            select * from employees limit 100
        </select>
        <select id="findById" resultType="EmployeeDTO">
            select * from employees where emp_no=#{emp_no}
        </select>
        <insert id="save" parameterType="EmployeeDTO">
            insert into employees (emp_no,gender, birth_date, last_name, first_name,hire_date)
            values (#{empNo},#{gender}, #{birthDate}, #{lastName}, #{firstName},#{hireDate})
        </insert>
        <delete id="deleteEmployeeById">
            Delete from employees 
            where emp_no=#{emp_no}
        </delete>
    </mapper>
    ```
## Datasource 및 환경 설정

- pom.xml 라이브러리 추가: dependency
  ``` xml
  <dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-jdbc</artifactId>
  </dependency>

  <!-- For local, use memroy db H2 -->
  <dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
	</dependency>
  <!-- For development & product environment -->
  <dependency>
    <groupId>org.mariadb.jdbc</groupId>
    <artifactId>mariadb-java-client</artifactId>
  </dependency>
  
  <dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>2.2.0</version>
  </dependency>
  ```
- application.properties에 Datasource 추가 
  ``` properties
  # for memory db h2
  spring.h2.console.enabled=true
  spring.h2.console.path=/h2-console

  spring.datasource.url=jdbc:h2:mem:employees
  spring.datasource.driverClassName=org.h2.Driver
  spring.datasource.username=sa
  spring.datasource.password=
  spring.jpa.database-platform=org.hibernate.dialect.H2Dialect

  # initailize data in h2
  spring.sql.init.schema-locations=classpath*:database/schema.sql
  spring.sql.init.data-locations=classpath*:database/data.sql

  spring.sql.init.mode=always

  mybatis.configuration.map-underscore-to-camel-case=true
  logging.level.net.kubepia.sam.restapp.mybatis=TRACE
  ```
- application-dev.properties에 Datasource 추가
  ``` properties
  spring.datasource.url=jdbc:mariadb://[server addess]:3306/employees
  spring.datasource.username=root
  spring.datasource.password=passw@rd
  spring.datasource.driver-class-name=org.mariadb.jdbc.Driver

  mybatis.configuration.map-underscore-to-camel-case=true
  logging.level.net.kubepia.sam.restapp.mybatis=TRACE
  ```

  ::: tip
  [mybatis 추가설정](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)
  :::

## 실습

### Step 1 : local 개발용 datasource 설정
1. open src/main/resource/application.properties
2. 데이터 소스 정보 추가
   ``` properties
   # db console 설정
   spring.h2.console.enabled=true
   spring.h2.console.path=/h2-console

   # datasource 설정
   spring.datasource.url=jdbc:h2:mem:employees
   spring.datasource.driverClassName=org.h2.Driver
   spring.datasource.username=sa
   spring.datasource.password=
   spring.jpa.database-platform=org.hibernate.dialect.H2Dialect

   # 초기 테이블 생성
   spring.sql.init.schema-locations=classpath*:database/schema.sql
   # 초기 데이터 생성
   spring.sql.init.data-locations=classpath*:database/data.sql

   # app 실행시 initialize 실행 조건
   spring.sql.init.mode=always
   ```
3. mybatis 설정
   ``` properties
   # Mapper Scanning & ResultType 타입 해석 위치
   mybatis.type-aliases-package=net.kubepia.sam.restapp.mybatis.model;net.kubepia.sam.restapp.mybatis
   # Column vs Property Mapping first_name <-> firstName
   mybatis.configuration.map-underscore-to-camel-case=true
   mybatis.configuration.default-result-set-type=FORWARD_ONLY
   mybatis.configuration.default-statement-timeout=30

   # xml mapper file 위치 지정
   mybatis.mapper-locations: mybatis/**/*.xml
     ```
### Step 2: Mybatis 구현
1. Table 구조 참고하여, EmployeeDTO.java 작성  
    예) /src/main/java/net/kubepia/sam/restapp/mybatis/model/EmployeeDTO.java
    ``` sql
    CREATE TABLE employees (
        emp_no      INT             NOT NULL,
        birth_date  DATE            NOT NULL,
        first_name   VARCHAR(14)     NOT NULL,
        last_name   VARCHAR(16)     NOT NULL,
        gender      ENUM ('M','F')  NOT NULL,    
        hire_date   DATE            NOT NULL,
        PRIMARY KEY (emp_no)
    );
    ```
2. Annotation을 활용하여 Mapper class 작성  
  예) /src/main/java/net/kubepia/sam/restapp/mybatis/EmployeeMapper.java  
   ``` java
   @Mapper
   public interface SamEmployeeMapper {
     @Select("select * from employees limit 100")
     List<EmployeeDTO> selectAll();
     @Select("select * from employees where emp_no=#{emp_no}")
     EmployeeDTO findById(@Param("emp_no") int id);
     @Insert("insert into employees (emp_no,gender, birth_date, last_name, first_name,hire_date)  values (#{empNo},#{gender}, #{birthDate}, #{lastName}, #{firstName},{hireDate} )")
     void save(EmployeeDTO employee);
     @Delete("Delete from employees where emp_no=#{emp_no}")
     void deleteEmployeeById(@Param("emp_no") int id);
   }
   ```
### Step 3: Controller, Service를 생성하여 Restful API를 생성
1. selectAll : GET http://localhost:8080/mybatis/employees
2. findById : GET http://localhost:8080/mybatis/employees/{id}
3. save: POST http://localhost:8080/mybatis/employees
4. deleteEmployeeById: DELETE http://localhost:8080/mybatis/employees

### Step 4: Test
1. open [localhost:8080/](http://localhost:8080/swagger-ui)
2. test RestAPI