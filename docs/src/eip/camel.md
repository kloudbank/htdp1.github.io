# Apache Camel and EIP
Apache Camel 은 EIP(Enterprise Ingregration Pattern) 을 구현하기 위한 다양한 컴포넌트를 제공합니다. 주로 다양한 환경의 메시징 인터페이스를 관리하는 코드를 1줄의 코드로 구현이 가능하게 합니다. 또한 file, ftp, http 및 rest api 도 컴포넌트로 제공이 됩니다. 그리고 추가로 필요한 컴포넌트는 직접 java 로 개발이 가능합니다.

다만, 공식 가이드 문서가 개발에 필요한 내용을 충분히 제공하지 못하고 있고, 구글링을 통해서도 개발 자료를 얻기가 어려운점 때문에 러닝커브가 높을 것으로 예상됩니다.

자세한 내용은 아래 참고 URL 을 확인하세요.

> Camel supports most of the Enterprise Integration Patterns
<https://camel.apache.org/components/latest/eips/enterprise-integration-patterns.html>

> Patterns and Best Practices for Enterprise Integration
<https://www.enterpriseintegrationpatterns.com>

JMS message 를 발송하는 간단한 예제입니다.
- URI format 
    ```
    jms:[queue:|topic:]destinationName[?options]
    ```
- Java route snippet
    ``` java
    from("direct:foo")
        .to("jms:queue:foo")
    ```
- And in XML
    ``` xml
    <route>
        <from uri="direct:foo">
        <to uri="jms:queue:foo"/>
    </route>
    ```