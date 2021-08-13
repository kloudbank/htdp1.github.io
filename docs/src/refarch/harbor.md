# 3조 소과제: Harbor

## Why Harbor?

### 1. Harbor란?
#### 1. Harbor?

![What is harbor?](../refarch/image/harbor-whatisharbor.png) 
(출처 : https://goharbor.io/)

Harbor는 정책 및 역할 기반 액세스 제어로 artifact를 보호하고, 이미지가 스캔되고 취약성이 없는지 확인하고, 이미지를 신뢰할 수 있는 것으로 서명하는 오픈 소스 레지스트리입니다. CNCF(Cloud Native Computing Foundation) 재단 Graduated 프로젝트인 Harbor는 규정 준수, 성능 및 상호 운용성을 제공하여 Kubernetes 및 Docker와 같은 클라우드 네이티브 컴퓨팅 플랫폼에서 일관되고 안전하게 artifact를 관리하는 데 도움이 됩니다.

![CNCF 프로젝트 성숙도 기준](../refarch/image/harbor-maturitylevels.png) 
(CNCF 프로젝트 성숙도 기준, 출처: https://www.cncf.io/projects/)

<img src="../refarch/image/harbor-container.png" width="70%" height="70%">

(출처: https://landscape.cncf.io/?category=container-registry&grouping=category)

#### 2. Architecture Overview

![Harbor Architecture](../refarch/image/harbor-archi.png)
(출처: https://github.com/goharbor/harbor/wiki/Arch%E3%85%81itecture-Overview-of-Harbor)

#### 3. Main Feature

![Harbor Mainfeature](../refarch/image/harbor-mainfeature.png)
(출처: https://goharbor.io/)

*  Security and vulnerability analysis
    -   Harbor는 이미지를 정기적으로 스캔하여 취약성을 확인하고 취약한 이미지가 배포되는 것을 방지하기 위한 정책 검사를 수행한다.
*  Content signing and validation
*  Multi-tenant
*  Extensible API and web UI
*  Image replication across multiple Harbor instances
    -   filter(repository, tag, label)를 사용하는 정책을 기반으로 여러 레지스트리 인스턴스 간에 이미지와 차트를 복제(동기화)할 수 있다. Harbor는 오류가 발생하면 자동으로 복제를 재시도한다. 이는 로드 밸런싱을 지원하고 고가용성을 달성하며 하이브리드 및 다중 클라우드 시나리오에서 다중 데이터 센터 배포를 촉진하는 데 사용할 수 있다.
*  Identity integration and role-based access control(RBAC) : 프로젝트별로 유저의 권한을 따로 부여할 수 있고, 그 권한에 따라 액션이 제한된다.

![Harbor RBAC](../refarch/image/harbor-rbac.png)
(출처: https://github.com/goharbor/harbor/blob/master/docs/user_guide.md#role-based-access-controlrbac)



### 2. Why Harbor?
#### 1. public vs. private

컨테이너 레지스트리에는 public 및 private의 두 가지 유형이 있습니다.

\- **public registry**는 abilities/offerings 측면에서 기본적이며 사용하기 쉽고, 가능한 한 빨리 registry를 시작하고 실행하려는 개인 또는 소규모 팀에 적합합니다. 그러나 규모가 성장함에 따라 패치, 개인 정보 보호 및 액세스 제어와 같은 보안 문제가 발생할 수 있습니다.

\- **pirvate registry**는 원격으로 호스팅되거나 온프레미스에서 호스팅되는 엔터프라이즈 컨테이너 이미지 스토리지에 보안 및 개인 정보를 통합하는 방법을 제공합니다. 회사는 자체 컨테이너 registry를 만들고 배포하도록 선택하거나 상업적 private registry 서비스를 선택할 수 있습니다. 이러한 private registry에는 고급 보안 기능과 기술 지원이 함께 제공되는 경우가 많습니다.


#### 2. nexus vs. harbor

<table style="border-collapse: collapse; width: 100%;" data-ke-align="alignLeft" data-ke-style="style12"><tbody><tr style="height: 18px;"><td style="width: 17.0542%; height: 18px; text-align: center;">&nbsp;</td><td style="width: 44.1473%; height: 18px; text-align: center;"><b>nexus</b></td><td style="width: 38.7984%; height: 18px; text-align: center;"><b>harbor</b></td></tr><tr style="height: 18px;"><td style="width: 17.0542%; height: 18px; text-align: center;"><b>docker</b></td><td style="width: 44.1473%; height: 18px;"><span style="color: #000000;"><span>&nbsp;</span>Docker Registry가 주된 기능이 아닌 통합 Repository 개념</span></td><td style="width: 38.7984%; height: 18px;"><span style="color: #000000;">Docker Registry이외에 Garbage Collection, Docker Image 취약점 점검 등의 부가 기능을 추가로 제공</span></td></tr><tr style="height: 18px;"><td style="width: 17.0542%; height: 18px; text-align: center;"><b>Active/Active HA</b></td><td style="width: 44.1473%; height: 18px;">Nexus Repository Pro에 한해 HA-C 지원<br>(Starts at 3,000$/year)</td><td style="width: 38.7984%; height: 18px;">Replication으로 Registry 간의 이미지 동기화 지원</td></tr></tbody></table>

![Nexus](../refarch/image/harbor-nexus.png)
(출처: https://help.sonatype.com/repomanager3/high-availability)

#### 3. Harbor?

<table style="border-collapse: collapse; width: 100%;" data-ke-align="alignLeft" data-ke-style="style12"><tbody><tr style="height: 18px;"><td style="width: 33.3333%; text-align: center; height: 18px;">pros</td><td style="width: 33.3333%; text-align: center; height: 18px;">cons</td></tr><tr style="height: 18px;"><td style="width: 33.3333%; height: 18px;">identity management</td><td style="width: 33.3333%; height: 90px;" rowspan="5"><h3 data-ke-size="size23"><span style="font-size: 15px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, AppleSDGothicNeo-Regular, 'Malgun Gothic', '맑은 고딕', dotum, 돋움, sans-serif; letter-spacing: 0px;">hard to setup on k8s cluster</span></h3></td></tr><tr style="height: 18px;"><td style="width: 33.3333%; height: 18px;">API and graphical UI</td></tr><tr style="height: 18px;"><td style="width: 33.3333%; height: 18px;"><span style="color: #151515;">Vulnerability scanning</span></td></tr><tr style="height: 18px;"><td style="width: 33.3333%; height: 18px;">image replication</td></tr><tr style="height: 18px;"><td style="width: 33.3333%; height: 18px;">online or offline installation</td></tr></tbody></table>
(출처: https://www.slant.co/topics/2436/~best-docker-image-private-registries)



### 3. Our Harbor Architecture

![DP3 Harbor Archi.](../refarch/image/harbor-dp3archi.png)




## Practice
### 1. HTTPS 수신 컨트롤러 구성


### 2. Harbor 설치


### 3. keyclock OIDC 연동 및 권한제어


### 4. Registry Replication


### 5. Vulnerability Scanning







