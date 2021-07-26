# Mybatis

데이터 처리를 위한 방법 중 많이 사용되고 있는 mybatis 기본적인 사용법을 설명 합니다.
springboot에서는 기본적으로 하나의 datasource를 지원(auto configuration)하고 있으며,
여러개의 datasource를 사용할 경우는 프로그램에서 추가적으로 설정해줘야함
(여러개의 datasource는 별도의 app으로 분리 하는것이 더 효율적임)

## datasource 및 환경 설정

- pom.xml 라이브러리 추가: dependency
  ``` xml
  <dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-jdbc</artifactId>
  </dependency>
  <dependency>
    <groupId>org.mariadb.jdbc</groupId>
    <artifactId>mariadb-java-client</artifactId>
  </dependency>
  <dependency>
     <groupId>org.mybatis</groupId>
     <artifactId>mybatis-spring</artifactId>
     <version>2.0.2</version>
   </dependency>
  ```
- application.properties에 Datasource 추가 : [mybatis 추가설정](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)
  ```
  spring.datasource.url=jdbc:mariadb://localhost:3306/employees
  spring.datasource.username=root
  spring.datasource.password=passw@rd
  spring.datasource.driver-class-name=org.mariadb.jdbc.Driver

  mybatis.type-aliases-package=net.kubepia.sam.restapp.mybatis
  mybatis.configuration.map-underscore-to-camel-case=true
  ```

##