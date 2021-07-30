# 2조 소과제: Keycloak

## Keycloak
### Keycloak 이란
* Keycloak은 최신 애플리케이션 및 서비스를 대상으로 하는 오픈 소스 ID 및 액세스 관리 솔루션입니다. 코드를 거의 사용하지 않고 애플리케이션과 서비스를 쉽게 보호할 수 있습니다.
* KeyCloak은 기본 인증 방식이 OAuth 2.0을 베이스로 한 OIDC
* Kubernetes 나 MSA 환경에 최적화 된 솔루션이다.

### Keycloak Core Concepts
* Keycloak Core Concepts

![Keycloak Core Concepts](../refarch/image/keycloakArch.png) 

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
* OIDC (OpenID Connect)
    * OAuth 2.0 프로토콜을 기반으로 상위계층에서 간편하게 인증을 처리하며, 신원확인 서비스(IDP)를 통해 보다 안전한 방식으로 사용자 정보를 제공할 수 있습니다.

## Keycloak 실습
* Keycloak, Grafana 설치
* Keycloak 설정
* Keycloak Realm, Client ID 확인

### Keycloak with k8s Apps
* Keycloak with k8s Apps

![Keycloak with k8s Apps](../refarch/image/keyCloakWithK8sApp.png) 

### Keycloak, Grafana 설치
- Keycloak, Grafana 설치 및 연동 쉘 파일, yaml 파일 로컬PC에 Clone
  - yaml 파일 내 AWS 설정으로 Private Repository 상태
  - 해당 Repository에 팀원으로 초대하기 위한 별도 요청 필요
```bash
git clone https://github.com/Salteed/dp2_keycloak
```

- 01_install.sh 실행
  - 아래 입력 정보
    - keycloak 설치할 Namespace
    - keycloak 관리자 계정
    - keycloak 관리자 비밀번호
    - Grafana 설치할 Namespace
  - keycloak, grafana 엔드포인트 확인
```bash
sh 01_install.sh
```

### Keycloak 설정
- 02_keycloak_setting.sh 실행
  - 아래 정보 입력
    - keycloak에 추가할 realm 이름
    - realm에 추가할 Client ID
```bash
sh 02_keycloak_setting.sh
```

### Keycloak Realm, Client ID 확인
- 




(아래는 참고 추후 내용 삭제 예정)

- $ sh 01_install.sh 실행
- keycloak  네임스페이스 입력(- 입력)
- keycloak ID/PW 입력
- grafana 네임스페이스 입력
- 엔드포인트 출력됨 (대기 뜨는거 확인 후 다음 진행)

- $ sh 02_keycloak_setting.sh
- realm 이름 입력
- realm 에 추가할 client ID 입력
- keycloak admin 로그인

// 3번 단계
- realm 확인, client sk 확인
  - clients 설정
  - sk 클릭
  - (Base URL : login_generic_oauth 선택)  API 호출로 됨
  - Access Type : confidential 로 선택 후 저장
  - Credential 탭 선택
  - Secret 키 복사
  - Roles 탭 선택
  - Role Name 입력 grafana_role (임의로) 입력 후 저장
  - 왼쪽 Roles 메뉴 선택
    - default-roles-subway 클릭
    - Client Roles 선택, client 이름 sk 선택
    - grafana_role 확인 (생성한) 후 add
  - Users 메뉴 선택
    - Add User 선택
    - User Name : user01 입력
    - Email : 아무거나 입력 후 저장
    - Credentials 탭 들어가서 비밀번호 저장

//
- Secret 키 쉘 파일에 입력 
- $ 04_connect_authorization.sh 실행
- grafana URL에 포트 3000 추가해서 접속








