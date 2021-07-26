# App. 환경설정
springboot가 실행하는데 필요한 환경설정은 application.properties 파일에 의해 관리됨.

## 주요 설정 내용
- core : 로그, 실행모두(debug), profile 등
- cache : redis, jcache 등
- data : dbms, datasource, dbcp(hikari) 등
- web : mvc, session, locale 등
- server : address, port, http 모드, tomcat/jetty, thread min/max 등

cf) [springboot application.properties](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)

## 위치
기본적으로 java path(./src/java/resource)에 위치하나, build 이후 jar 내부에 포함되어 archiving됨
application.properties 위치에 따라 순서적으로 반영되며, 나중에 로딩되는 값이 선행된 값을 over write됨

1. classpath://application.properties : ./src/java/resource/application.properties
2. classpath://config/application.properties
3. ./application.properties : 실행위치
4. ./config/application.properties

그 이외에도 개발 값을 command line, JNDI, Java System Properties, OS Environment에 의해 설정 할 수 있음

## profile을 활용한 구조화
> application.properties 파일은 기본적으로 로딩되며, 실행시 지정된 profile에 의해  
> application-{profile}.properties 파일이 병합됨

* application.properties : 환경설정에 필요한 값을 공통적인 값과 기본값으로 모두 설정
* application-{profile}.properties : profile에 따라 변경되어야 할 값만 별도 설정

## Externalized 활용
빌드(jar, Docker)후에 기존 생성된 jar 또는 Container를 재사용하고자 할 때, application.properties에 지정된 값을 변경하고자 하는 경우 외부 파일을 사용할 수 있음. [실행 위치 참조](#위치)