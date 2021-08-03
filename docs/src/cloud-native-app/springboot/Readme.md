# Overview

Springboot는 Web Application 서버상에서 시실행되는 Spring Framework과 동일한 기능을 제공하며,  
Cloud Native 환경을 위해 Spring Framework의 Application Context(Container)에서  
Web Application을 Embedded하여 처리하여 단일 Process로 관리할 수 있도록 새롭게 만들어진 Framework 임. 

| 구분              | Springboot                                                                                          | Spring Framework                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 실행 방법         | Java Application<br> 예) java -jar /app/app.jar                                                     | Web Application에 실행될 수 있도록 Web Context Descriptor 필요(war, ear)                   |
| App 자원 관리     | Spring Context에서 관리 됨                                                                          | Web Application의 설정에 의해 관리됨                                                       |
| Web app 환경 설정 | 기본값으로 모든 설정 값이 자동설정되며, <br>application.yml(properties) 파일에 의해 설정 할 수 있음 | Web Context(server.xml)에 의해 설정되며, <br>사용되는 servlet 및 Web App Server마다 상이함 |

<Comment />