# Restful API

> REST(*RE*presentational *S*tate *T*ransfer)  
> The key abstraction of information in REST is a resource.

> API
> Set of definitions and protocols for building and  
> integrating application software.

```
자원의 정보를 주고 받기 위한 API
```
ref) https://restfulapi.net/

## 6 Architectural Constraints

1. Uniform interface  
   : 시스템 내부에 있는 자원을은 유일한 의미있는 URI(uniform resource identifier)가 있으며, 정보획득, 부여 등의 기능을 수행할 수 있어야 함
2. Client-server  
   : URI가 변하지 않는 다면 client와 server는 종속성 없이 개발/발전 시킬수 있어야 한다.
3. Stateless  
   : 서버는 이전 요청 또는 마지막 요청의 어떤 정보도 유지 하지 않고 각각의 요청에 대해서만 처리한다. No session, No history
4. Cacheable  
  : 가능하다면 자원의 정보는 캐쉬처리를 해야한다.  
    ```
    Well-managed caching partially or completely eliminates some client-server interactions, further improving scalability and performance.
    ```
5. Layed system  
   : api, data, 인증 등을 서로 다른서버로 분리하여 구성 할 수 있다.
6. Code on demand(optional)  
   : 필요시 실행가능한 결과물(code, UI rendered 등)를 제공할 수 있다.

## Resource Methods
> 꼭 http GET/POST/PUT/DELETE을 써야 하는 것은 아니다.  
> 필요에 따라 정의하면 된다.  
> 그러나, 일반적으로 http methods를 많이 활용한다.

| Features           | GET Methods                       | POST/PUT/DELETE   |
| ------------------ | --------------------------------- | ----------------- |
| Cacheable          | Yes                               | No                |
| Browser History    | Yes                               | No                |
| Bookmark           | Yes                               | No                |
| Length             | Max: 2048 char                    | Free              |
| Back button/Reload | Harmless                          | Data re-submitted |
| Encoding           | application/x-www-form-urlencoded | any               |
| Data Type          | Only ASCII                        | No restrictions   |

### GET Methods
> 주로 데이터 요청에 사용됨.

http(s)://domain/[path]/[servlet]?key1=value&key2=value

``` sh
curl --location --request GET 'https://api.bithumb.com/public/candlestick/BTC_KRW/1m'
```

### POST/PUT Methods
> 데이터를 전송해서 리소스를 생성 또는 변경에 사용되며,  
> 데이터는 http request의 body에 위치한다.

* POST vs PUT  
  > 실행결과가 항상 동일한 멱등성이 있는 경우 일반적으로 **PUT**을 사용함

```
POST [servlet_path] [HTTP/1.1 or HTTP/2]
Host: [Domain]
key11=value1&key2=value2
```

```
PUT [servlet_path] [HTTP/1.1 or HTTP/2]
Host: [Domain]
key11=value1&key2=value2
```

``` sh
curl --location --request POST 'http(s)://[domain]/[servlet_path]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "key1": "value",
    "key2": "value"
}'
```