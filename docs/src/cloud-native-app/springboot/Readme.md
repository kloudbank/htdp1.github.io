# Overview

Springboot는 Web Application에서 시실행되는 Spring Framework과 동일한 기능을 제공하며,  
Cloud Native 환경을 위해 Spring Framework의 Application Context(Container)에서  
Web Application을 Embedded하여 처리하여 단일 Process로 관리할 수 있도록 만들어진 Framework 임. 

| 구분              | Springboot                                                                                          | Spring Framework                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 실행 방법         | Java Application<br> 예) java -jar /app/app.jar                                                     | Web Application에 실행될 수 있도록 Web Context Descriptor 필요(war, ear)                   |
| App 자원 관리     | Spring Context에서 관리 됨                                                                          | Web Application의 설정에 의해 관리됨                                                       |
| Web app 환경 설정 | 기본값으로 모든 설정 값이 자동설정되며, <br>application.yml(properties) 파일에 의해 설정 할 수 있음 | Web Context(server.xml)에 의해 설정되며, <br>사용되는 servlet 및 Web App Server마다 상이함 |

## tomcat model

@startuml
skinparam linetype polyline

actor client
node web [
  <b>Web server</b>
]

file static [
  html
  javascript
  css
  image
]

node tomcat [
  <b>tomcat</b>
  ----
  one jvm
  one process
]
component app1 [
  webapp/app1
]
component app2 [
  webapp/app2
]
component app3 [
  webapp/app3
]
component app4 [
  webapp/app4
]
client -right-> web
web .right. static
web --> tomcat
tomcat --> app1 : domain.com/app1
tomcat --> app2 : domain.com/app2
tomcat --> app3 : domain.com/app3
tomcat --> app4 : domain.com/app4
@enduml

기본적으로 tomcat은 하나의 프로세스로 실행되며, tomcat내에서 Web Application에 필요한 자원(Datasource, Resource, http)를 관리하며,
호스트로 부터 할당 받은 Computing 자원(CPU/Memory)는 배포되어 있는 WAR/EAR들에 의해 공유됨
Application 별로 Computing 자원을 제어하기 위해서는 독립적인 Tomcat을 실행 하여야 함
Micro Service 적용시 Workload에 따른 Computing 자원을 조율하고 Instance Replicas를 관리하기에는 우

::: tip Pros.
- 일관된 Resource 설정으로 WAS Engineer에 의해 통합관리에 용이하다
- JEE Specification 기능을 사용할 수 있다
- Application을 위한 Was Tunning이 자유롭다(JVM, Datasource, TCP Pooling 등)
- Application Profile이 용이하다
:::

::: danger Cons.
- Infra/Middleware Engineering을 위한 지식이 필요(조직과 협업)
- Build Once, Deploy Many에 추가 작업이 필요하다
- Computing 자원의 상세 제어가 어렵다
- JVM Corruption 시 Web App 전체 영향을 미친다
- Web App 간 Memory 간섭이 존재한다
:::

## Springboot Model

@startuml
skinparam linetype polyline

actor client

file static [
  html
  javascript
  css
  image
]
node web [
  <b>Web server</b>
]

actor client

node routing [
  <b>routing</b>
  ----
  Loadbalancer(L4/L7)
  API Gateway
  Ingress Controller
]
component app1 [
  webapp/app1
]
component app2 [
  webapp/app2
]

component app3 [
  webapp/app3
]
component app4 [
  webapp/app4
]
client --> routing
routing --> web
web .. static

routing --> app1
routing --> app2
routing --> app3
routing --> app4

@enduml

::: tip Pros.
- Best Practice 기본 설정 지원으로 일반적인 설정이 필요 없다
- WAS가 Embedded되어 있어 WAS 없이 Standalone으로 실행 가능하다(Deploy Many)
- Web/Was를 위한 Descriptor 설정이 필요 없다: WAR, EAR
- Spring 제단의 다양한 Boilerplate를 활용할 수 있다
- 독립적으로 Computing 자원을 설정할 수 있다
:::

::: danger Cons.
- Datasource를 여러개 사용하기 불편하다
- JSP를 사용하기 불편하다(WAR 배포로 재설정해야 함)
- 지원 WAS 제약 : Tomcat, Jetty, Undertow
- JEE 기능을 활용하든데 제약(As-Is J2EE 기반 APP Re-Architecture 필요)
- Multiple App, MSA의 경우 Traffic 제어를 위한 Gateway 또는 LB가 필수적으로 필요하다
:::

## [VSCode로 IDE 구성하기](ide.md)

<Comment />