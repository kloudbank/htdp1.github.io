# Restful API

## Request Mapping
1. Base URL : Class 수준에 Annotation @ReqeustMapping으로  지정하고, class내 함수는  
   지정된 Base 경로를 기준으로 URL이 적용됨  
      
2. Methods  
   | Annotation                                                                | HTTP Method            | Remark            |
   | ------------------------------------------------------------------------- | ---------------------- | ----------------- |
   | @RequestMapping(path="path/path") <br> @RequestMapping(value="path/path") | GET/POST/PUT/DELETE .. | 모든 HTTP Methods |
   | @GetMapping("path")<br> @GetMapping(path="path/{variable})                | GET                    |                   |
   | @PostMapping("path")<br> @PostMapping(path="path/{variable})              | POST                   |                   |
   | @PutMapping("path")<br> @PutMapping(path="path/{variable})                | PUT                    |                   |
   | @DeleteMapping("path")<br> @DeleteMapping(path="path/{variable})          | DELETE                 |                   |

3. URL 적용하기
   1. Annotation의 속성에 **path** 또는 **value** 값에 경로를 입력
   2. url pattern
      * "/resources/ima?e.png" - match one character in a path segment
      * "/resources/*.png" - match zero or more characters in a path segment
      * "/resources/**" - match multiple path segments
      * "/projects/{project}/versions" - match a path segment and capture it as a variable
      * "/projects/{project:[a-z]+}/versions" - match and capture a variable with a regex


4. Sample  
   ``` java
   @RequestMapping(path = "tutorial") // root reqeust path, define in value="" or path=""
   public class SamRequestmappingController {

      @RequestMapping(path="reqmapping", method=RequestMethod.GET)
      public String getMapping(){
         return "get method using RequestMapping\n";
      }

      @GetMapping("/methods")
      public String getMethod() {
         return "this is \"Get\" method\n";
      }

      @PostMapping(value="/methods")
      public String postMethod() {
         return "this is \"Post\" method\n";
      }

      @PutMapping(path="/methods")
      public String putMethod() {
         return "this is \"Put\" method\n";
      }

      @DeleteMapping("/methods")
      public String deleteMethod() {
         return "this is \"Delete\" method\n";
      }

      @GetMapping(value="/reg/{major:[vV][0-9]+}-{minor:[0-9]+}")
      public String getRegularExp(@PathVariable String major, @PathVariable String minor) {
            return "version:"+major+"-"+minor+"\n";
      }
   }
   ```

## Request Input 처리
::: tip
HTTP의 request에서 동적인 값 전달 방식은 Header, Coookie, QueryString, Form, Body를 통해 전달되며, Servlet의 Session 값을 이용하여 메모리 상에 임시로 데이터를 저장하고 활용 할 수 있음.  
Cloud Native Application에서 Session을 활용하는 경우는 여러 불 특정한 여러 instance에서 공유해야 함으로 추가적인 미들웨어(Redis, DB 등)를 활용해야 한다.
:::
1. http header 처리  
   http header 는 Key:Value 구조로 되어 있으며, 로직 처리에 있어 http header 값을 식별하여 처리할 경우 사용하며, http의 header의 값은 key 값을 이용하여 함수의 인자로 맵핑하여 처리 가능함  
   Annotation @RequestHeader(value="key", required=true/false, defaultValue = "value") 형태로 사용함
   ``` java
   // RequestHeader
   @GetMapping("header")
   public String handleHeader(@RequestHeader("Accept") String accept,
         @RequestHeader(value = "Keep-Alive", required = false, defaultValue = "300") long keepAlive) {

      return "Header => Accept:" + accept + ",Keep-Alive:" + keepAlive + "\n";
   }

   @GetMapping("headers")
   @ResponseStatus(value = HttpStatus.OK)
   public void allHeaders(@RequestHeader Map<String, String> headers) {

      logger.info("All headers:{}", headers);
   }
   ```
2. http cookie 처리  
   http cookie는 Key:Value 구조로 되어 있으며, 로직 처리에 있어 http cookie 값을 식별하여 처리할 경우 사용하며, http의 cookie 값은 key 값을 이용하여 함수의 인자로 맵핑하여 처리 가능함  
   Annotation @CookieValue(value="key", required=true/false, defaultValue = "value") 형태로 사용함  
   ``` java
   // curl -v --cookie "USER=SK" http://localhost:8080/input/cookie
   @GetMapping("cookie")
   @ResponseStatus(HttpStatus.OK)
   public void handleCookie(@CookieValue("USER") String user) {
      logger.info("Cookie User:{}", user);
   }
   ```
3. URL path 처리, path의 일부를 입력변수로 처리 하는 방법  
   Request value에 {..}를 사용하여 요청처리 함수에서 변수로 인식하고 type을 자동변환하여 사용 할 수 있음  
   1. 단순 변수 처리 URI의 특정 영역을 변수화 : "/projects/{project}/versions"  
      ```java
      @GetMapping("/owners/{ownerId}/pets/{petId}")
      public Pet findPet(@PathVariable Long ownerId, @PathVariable Long petId) {
         // ...
      }
      ```
   2. 변수이름을 지정 또는 변수의 유형을 regualr expression을 활용하여 uri의 문자열을 축출하여 변화화
   ```java
      @GetMapping(value="/reg/{major:[vV][0-9]+}-{minor:[0-9]+}")
      public String getRegularExp(@PathVariable String major, @PathVariable String minor) {
            return "version:"+major+"-"+minor+"\n";
      }
   ```
4. URL의 QueryString의 값을 변수처리 하는 방법 : @RequestParam을 이용하여 사용  
   request : http://.../param?name=james&age=30
   ```java
   @GetMapping("param")
   public String handleQueryString(@RequestParam("name")String name, @RequestParam("age")int age){
      
      return "name :" + name + ",age:"+age +"\n";
   }
   ```

5. http body의 값을 Java 객체로 처리하는 방법(json to object)
   ![](img/2021-06-09-16-42-10.png)  
   ::: tip
   http post로 요청되며, http의 body가 자동으로 지정된 구조(type)로 변환됨  
   http body에 요청되는 데이터가 json 인 경우, 서버에 매핑되는 객체를 선언하고 자동으로
   controller 함수 파라미터롤 생성해서 로직을 처리 할 수 있도록 기능을 제공함  
   :::
     ```java
      /* 
      curl --location --request POST 'localhost:8080/input/body' \
         --header 'Content-Type: application/json' \
         --data-raw '{
            "title":"제목",
            "description":"설명"
         }' 
         */
      @PostMapping("body")
      public @ResponseBody TodoItem handleRequestBody(@RequestBody TodoItem todo) {
            // todo.setTitle(todo.getTitle()+"-return");
            return todo;
      }
     ```

6. html form 값을 처리하는 방법  
   ![](img/2021-06-14-20-07-36.png)
   1. input  
      ```sh
      curl --location --request POST 'localhost:8080/input/form' \
          --form 'title="제목 값"' \
          --form 'description="설명입력값"'
      ```
   2. controller handler
      ```java
      @PostMapping(value = "form",produces = MediaType.APPLICATION_JSON_VALUE)
      public @ResponseBody String handleRequestForm(@RequestParam("title")String title, @RequestParam("description")String description){

         return "{ \"title\":"+ title +", \"description\":"+ description +"}\n";
      }
      ```

## Handling Response.

::: tip
rest api 요청을 처리하고 응답으로 단순 문자열, json 형태의 데이터를 응답할 수 있으며,  
응답 http에 필요한 header, http status, cookie 등을 처리 할 수 있음
본가이드에서는 restful api를 위한 내용만 설명함
:::
1. 단순 문자열 응답  
   요청 결과에 따른 문자열 값을 리턴함.
   ``` sh
   curl localhost:8080/output/string
   ```

   ``` java
   // Response String
   @GetMapping(value = "string")
   public String handleString() {
      log.info("response data as string");
      log.info(Charset.defaultCharset().displayName());
      return "This is sample response as 문자열\n";
   }
   ```
2. 객체를 json으로 응답  
   요청되는 비즈니스 로직(데이터 가공, 데이터베이스 select 등)를 처리하고, Value Object를 json 형태로  
   응답처리함.
   ::: tip
   return 객체는 Serializable interface 객체이어야함.  
   :::
     ``` java
     public class TodoItem implements Serializable{
      private int id;
      
      private String title;
      private String description;
      
      public TodoItem(int id,String title, String description){
         this.id = id;
         this.title=title;
         this.description=description;
      }

      public TodoItem(){
         this.id=new Random().nextInt();
         this.title="제목";
         this.description="설명";
      }
      
      public int getId() {
         return id;
      }

      public void setId(int id) {
         this.id = id;
      }
      ...
      }
     ```
   요청 처리 
      ``` sh
      curl localhost:8080/output/todo/9
      ```
      ``` java
      // Response json using object
      @GetMapping({ "todo/{id}", "todo" })
      public @ResponseBody TodoItem getTodo(@PathVariable(required = false) Integer id) throws Exception {
         log.info("id:{}", id);
         for (TodoItem todoItem : todos) {
            if (id == todoItem.getId()) {
            return todoItem;
            }
         }
         // throw new Exception("Cannot find todo item " + id);
         return null;
      }
      ```

3. http protocol 응답
   일반적인 Controller의 함수 argument에 HttpServletResponse 추가하여 reponse에 직접 처리함
   1. header 응답
      ``` java
      // Response json using object with header
      @GetMapping({ "header/{id}", "header" })
      public @ResponseBody TodoItem setHeader(@PathVariable(required = false) Integer id, HttpServletResponse response)
            throws Exception {
         id = id == null ? 0 : id;
         response.setHeader("biz-key", "value123456789");

         return todos.getFirst();
      }
      ```
   2. cookie 응답
      ``` java
      // Response json using object with cookie
      @GetMapping({ "cookie/{id}", "cookie" })
      public @ResponseBody TodoItem setCookie(@PathVariable(required = false) Integer id, HttpServletResponse response)
            throws Exception {
         id = id == null ? 0 : id;
         Cookie cookie = new Cookie("jwt-token", "value123456789");
         cookie.setMaxAge(86400);
         cookie.setSecure(true);
         cookie.setHttpOnly(true);
         cookie.setPath("/user/");
         cookie.setDomain("example.com");
         response.addCookie(cookie);
         return todos.getFirst();
      }
      ```
   3. status 처리
      ``` java
      // Response json using object with specific status code
      @GetMapping({ "status/{id}", "status" })
      public @ResponseBody TodoItem setStatus(@PathVariable(required = false) Integer id, HttpServletResponse response)
            throws Exception {
         id = id == null ? 200 : id;
         response.setStatus(id);

         return todos.getFirst();
      }
      ```
## 실습

1. Get 방식의 API 생성 : http://localhost:8080/restapi/lab01/{path-variable} 
   1. Controller Class를 만들고, Request Mapping 처리 함수를 등록
   2. Path 경로 값을 Input으로 활용
   3. Response를 단순 문자열로 응답처리
2. Post 방식의 API 생성 : http://localhost:8080/restapi/lab01/
   1. 기 생성된 Controller에 post mapping
   2. Input 처리를 위한 Value Class 생성
      ``` json
      {
       "title":"제목",
       "description":"설명"
      }'
      ```
   3. 요청받은 json을 객체로 맵핑된 내용에 제목 값변경하고 json으로 응답하기

<Comment />