# Legacy Interface 개발
대부분의 데이터를 Legacy system 이 갖고 있는 데이터를 조회하기를 원합니다. 보통 Legacy data 를 Database 연계를 통해서 내부 시스템으로 Data 를 복제하여 사용하거나 Legacy system 의 open api 가 제공된다면 권한을 획득하여 open api 를 활용하여 직접 데이터를 조회할 수 있습니다.

Legacy system 의 open api 를 활용하여 개발할 경우 대부분의 개발은 target api 를 정의하고 target api 에서 필요로 하는 payload 를 생성하고 target api 를 호출해서 api 에서 return 하는 object 를 ui 에서 필요한 json 객체로 변환하여 리턴하는 역할을 하게 됩니다. 

이 내용은 거의 모든 개발에 공통으로 적용되며 간단히 정리하면 아래와 같습니다.
- target api 정의
- payload 생성
- target api 호출
- translate object to json
- return json

이러한 공통적인 기능을 Apache Camel 의 domain-specific languages 를 통해서 XML 선언만으로도 구현이 가능하며, 필요하다면 java 코드(beans)로 여러가지 기능을 확장할 수 있습니다.

## Springboot 와 Apache Camel 을 이용한 개발 절차
Apcahe Camel 은 Springboot 을 위해 별도의 라이브러리를 제공할 정도로 친화적입니다. Apache Camel 만으로도 충분히 개발이 가능하지만 개발에 익숙한 springboot 를 이용하여 개발하는 과정을 설명합니다.

### springboot 프로젝트 생성
- vs code 에 Spring Boot Extension Pack 을 install 합니다.
- vs code > View > Command Palette 메뉴를 선택합니다.
- 입력창에 spring 을 입력한 후 Spring Initializer : Create a Maven Project 를 선택합니다.
- 이후 단계별 wizard 를 통해 springboot project 를 생성합니다.

### pom.xml 에 필요한 라이브러리 추가
``` xml
<dependency>
    <groupId>org.apache.camel.springboot</groupId>
    <artifactId>camel-spring-boot-starter</artifactId>
</dependency>
<dependency>
    <groupId>org.apache.camel.springboot</groupId>
    <artifactId>camel-http-starter</artifactId>
</dependency>
<dependency>
    <groupId>org.apache.camel.springboot</groupId>
    <artifactId>camel-rest-starter</artifactId>
</dependency>
<dependency>
    <groupId>org.apache.camel.springboot</groupId>
    <artifactId>camel-jackson-starter</artifactId>
</dependency>
```

### java code 를 이용한 개발
아래 java class 를 생성합니다.
``` java
package com.htdp1.camelspring.route;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.rest.RestBindingMode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import com.htdp1.camelspring.dto.Department;

@Component
public class RestRoute extends RouteBuilder {

	@Override
	public void configure() throws Exception {
		restConfiguration().component("servlet").bindingMode(RestBindingMode.json);
		
		// rest api 를 정의합니다.
        rest("/sample")
			.get("/")
			.to("direct:get_sample")
			.post("/")
			.to("direct:post_sample")
			;
		
		// get 에 대한 다른 rest api 로 routing 처리합니다.
        // api 는 별도로 개발이 필요합니다.
        from("direct:get_sample")
			.to("rest:get:?host=localhost:8090/sample/")
			;
		
        // post 에 대한 다른 rest api 로 routing 처리합니다.
        // api 는 별도로 개발이 필요합니다.
		from("direct:post_sample")
			.to("rest:post:?host=localhost:8090/sample/")
		;

	}
}
```

### run 및 test
- springboot 를 실행하고 아래 url 에 접속하여 return 을 확인합니다.
    > curl -X GET http://localhost:8080/sample/
    > curl -X POST http://localhost:8080/sample/ -d "{}"

### java 로 개발된 코드를 xml 로 구성
- resources 폴더에 아래 파일을 생성합니다.
- SpringRouteContext.xml
    ``` xml
    <?xml version="1.0" encoding="UTF-8"?>
    <beans xmlns="http://www.springframework.org/schema/beans"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="
            http://www.springframework.org/schema/beans
            http://www.springframework.org/schema/beans/spring-beans.xsd
            http://camel.apache.org/schema/spring
            http://camel.apache.org/schema/spring/camel-spring.xsd ">

        <camelContext xmlns="http://camel.apache.org/schema/spring">
            <rests>
                <rest path="/sample">
                    <get uri="/">
                        <to uri="direct:get_sample"/>
                    </get>

                    <post uri="/">
                        <to uri="direct:post_sample"/>
                    </post>
                </rest>
            </rests>

            <routes>
                <route>
                    <from uri="direct:get_sample" />
                    <to uri="rest:get:?host=localhost:8090/sample/">
                </route>
                
                <route>
                    <from uri="direct:post_sample" />
                    <to uri="rest:post:?host=localhost:8090/sample/">
                </route>
            </routes>
        </camelContext>

    </beans>
    ```