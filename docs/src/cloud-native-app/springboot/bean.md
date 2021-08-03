# Bean
::: warning Definition
Spring Framework의 Container에 의해 등록/생성/조회/관계 설정되는 객체로 일반적인 Java Object임.
:::

## Inversion Of Control / Dependency Injection
::: danger Definition
의존관계 처리 방식으로서, 해석하자면 "역전제어"와 "의존성 주입"
의역하자면 의존성을 명시적으로 즉, User user = new User(); 코드로 관계 설정을 하는 것이 아니라,
Spring Container에 의해 처리하도록 xml 또는 annotation으로 선언하는 것을 말합니다.
Springboot에서는 annotation을 활용하는 것이 일반적임.
:::
### 예시
Bean 선언
  ```java
  interface Ball {
    String touchBall();
  }

  @Component("soccerBall")
  public class SoccerBall implements Ball{
    public String touchBall(){
      return "축구공이 굴러간다";
    }
  }

  @Component("basketBall")
  public class BasketBall implements Ball{
    public String touchBall(){
      return "농구공이 굴러간다";
    }
  }
  ```
Bean 사용
  ``` Java
  @Component
  public class Player {
    @Autowired
    @Qualifier("soccerBall")
    private Ball ballA;
    @Autowired
    @Qualifier("basketBall")
    private Ball ballB;

    public String touch(){
      this.ballA.touchBall();
      this.ballB.touchBall();
    }
  }
  ```
## Instance/Memory 유형
::: tip
bean은 기본적으로 Spring Container에 1개의 인스턴스만 존재함. @Scope를 통해
다양한 방식을 지정할 수 있음
Bean 선언 뒤에 @Scope("..")로 지정할 수 있음
:::

::: warning 
기본적으로 Singleton구조로 객체의 데이터는 request별로 공유되어 조심해야함  
특히, 사용자 정보 등을 멤버 변수에 보관하게 되면 request 별로 정보가 섞여서 처리될 수 있음
:::

1. @Scope("singleton"): 기본(Default) 싱글톤 스코프. 하나의 Bean 정의에 대해서 Container 내에 단 하나의 객체만 존재한다.
2. @Scope("prototype") : 어플리케이션에서 요청시 (getBean()) 마다 스프링이 새 인스턴스를 생성
3. @Scope("request"):HTTP 요청별로 인스턴스화 되며 요청이 끝나면 소멸 (spring mvc webapplication 용도)
4. @Scope("session"):HTTP 세션별로 인스턴스화되며 세션이 끝나며 소멸 (spring mvc webapplication 용도)
5. @Scope("application"): webapp/springboot에서는 singleton과 동일한 기능으로 동작

::: tip
stateless한 restful api에서는 singleton 타입이 유효함.
:::

## Lifecycle
Bean 객체는 생성시 생성자 > @PostConstruct 순서로 실행되며, 소멸시에는 @PreDestroy 가 호출된다.

``` java
@Component("soccerBall")
public class SoccerBall implements Ball {
  public SoccerBall() {
    System.out.println("soccerBall created by constructor");
  }

  public String touchBall() {
    return "축구공이 굴러간다";
  }

  @PostConstruct
  public void init() {
    System.out.println("socckerball init");
  }

  @PreDestroy
  public void close() {
    System.out.println("socckerball destroy");
  }
}
```

## 선언 및 사용법
::: tip Usage
Bean은 기본적으로 Bean 생성자 함수 또는 클래스에 Annotation을 지정하여 Bean을 선언함

- @Bean : Method level annotation, bean factory 또는 생성 함수에 지정하여 선언
- @Component : Class level annotation, spring내 관리되는 컴포넌트
- @Repository : @Component와 기능은 동일하며, 주로 데이터 저장소(persistency), SQL 처리등에 사용됨
- @Service : @Component와 기능은 동일하며, Business Logic을 처리하는데 사용됨
- @Controller, @RestController : @Component의 종류로서, MVC 중 Controller와 view mapping을 자동처리하는 기능 제공됨  
:::

### Bean 선언
Springboot의 Annotation 방식 기준으로 설명

1. Bean Name 지정방법
   - 클래스명 또는 생성 함수 명을 기본 이름으로 사용함
   - 특정 이름을 사용하고자 하는 경우는 @Bean("Name"), 또는 @Qualifier("Name") 방식으로 지정함

2. 선언
   - @Bean : class에 @Configuration Annotation을 선언하고 멤버 함수에 @Bean을 지정하여 선언 됨
     ``` java
      @Configuration
      public class AppConfig {
        @Bean
        @Scope(value="singleton")
        public TodoList todos(){
          TodoList list = new TodoList();
          for(int i=0;i<10;i++){
            list.addLast(new TodoItem(i,"제목"+i,"description....."));
          }
          return list;
        }
      }
     ```
   - @Component, @Repository, @Service 등: class annotation으로 선언
     ``` java
      @Component("samcomponent")
      @Slf4j
      public class SamComponent {
        public String method() {
          log.info("component called");
          return "This is sample @Component";
        }
      }
     ```
3. bean 사용법 : 사용자고자 하는 멤버 변수 또는 함수 파라미터에 @Autowired와 @Qualifier를 선언하여 사용
   ``` java
    @RestController
    @RequestMapping(path = "bean")
    @Slf4j
    public class SamBeanController {
      @Autowired
      @Qualifier("samcomponent")
      private SamComponent myComponent;

      @GetMapping("")
      public String index() {
        log.info("request bean home called");

        return this.myComponent.method();
      }

      @GetMapping(value = "/usage")
      public String getMethodName(@Autowired @Qualifier("samcomponent") SamComponent comp) {
        return comp.method();
      }

    }
   ```
## 실습
1. Component를 생성하고, Controller의 멥버 변수에 자동으로 binding한다
   1. Component를 위한 class를 생성하고, 임의의 문자열 리턴함수를 생성한다.
   2. Controller에 멥버변수를 선언하고 annotation을 이용하여 binding 한다.
   3. Controller에 get api를 생성하고 component 호출 결과를 응답처리 한다.
2. Bean 생성을 프로그램적으로 처리하고, binding시 이름을 지정하여 처리함
   1. Interface 생성
      ``` java
      interface Ball {
        String touchBall(); 
      }
      ```
   2. Ball Interface 구현체 FootBall, BasketBall Class 생성하고 구현한다. 
   3. touchBall 함수는 각각의 클래스 별로 다른 문자열을 리턴
   4. Configuration class를 만들고 bean 생성 함수를 각각 FootBall, BascketBall용으로 생성한다
   5. Controller에 Ball 멥버변수를 선언하고 bean 이름을 별도로 지정하여 binding함
   6. Controller에 get api를 생성하고 component 호출 결과를 응답처리 한다.

<Comment />