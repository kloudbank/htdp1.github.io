# 2조 소과제: Keycloak

## Keycloak
### Keycloak 이란
* Keycloak은 최신 애플리케이션 및 서비스를 대상으로 하는 오픈 소스 ID 및 액세스 관리 솔루션입니다. 코드를 거의 사용하지 않고 애플리케이션과 서비스를 쉽게 보호할 수 있습니다.
* KeyCloak은 기본 인증 방식이 OAuth 2.0을 베이스로 한 OIDC

### Keycloak 장점
* 오픈소스로 제공되며 community 버전의 경우 별도의 비용없이 사용 가능

### Keycloak 기능
* User Registration
* Social login
* Single Sign-On/Sign-Off across all applications
* belonging to the same Realm
* 2-factor authentication
* LDAP integration
* Kerberos broker
* multitenancy with per-realm customizable skin

### Keycloak 관련 용어
* Realm
    * 인증, 인가가 작동하는 범위를 나타내는 단위이다. SSO(Single Sign-On)를 예로 들면 특정 클라이언트들이 SSO를 공유한다면 그 범위는 그 클라이언트들이 공통적으로 속한 Realm에 한정된다. 기본적으로 삭제가 불가능한 Master라는 Realm이 제공된다.
* Client
    * JBoss Keycloack에게 인증, 인가 행위를 대행하도록 맡길 애플리케이션을 나타내는 단위이다. 웹사이트일수도 있고, REST API를 제공하는 서비스일수도 있다. 하나의 Realm은 자신에게 종속된 n개의 Client를 생성하고 관리할 수 있다.
* User
    * 실제 각 Client에 로그인할 사용자를 나타내는 단위이다. 하나의 Realm은 자신에게 종속된 n개의 User를 생성하고 관리할 수 있다. 기본적으로 User 개체는 Username, Email, First Name, Last Name 4개 항목을 가질 수 있는데 Custom User Attributes 기능을 통해 커스텀 항목을 자유롭게 추가할 수 있다.

## Keycloak 실습
### Keycloak + Grafana 연동
* Keycloak 설치
* Grafana 설치
### Keycloak 설치
### Grafana 설치