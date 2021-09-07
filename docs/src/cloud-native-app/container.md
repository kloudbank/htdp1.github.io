# Container

::: danger 정의
컨테이너는 소프트웨어 서비스를 실행하는 데 필요한 특정 버전의 프로그래밍 언어 런타임 및 라이브러리와 같은 종속 항목과 애플리케이션 코드를 함께 포함하는 경량 패키지입니다.
:::

![image](./img/2021-08-05-22-09-20.png)

컨테이너는 어떤 환경에서나 실행하기 위해 필요한 모든 요소를 포함하는 소프트웨어 패키지입니다. 컨테이너는 이러한 방식으로 운영체제를 가상화하며 프라이빗 데이터 센터에서 퍼블릭 클라우드 또는 개발자의 개인 노트북에 이르기까지 어디서나 실행됩니다. Gmail에서 YouTube, Google 검색에 이르기까지 Google의 모든 제품은 컨테이너에서 실행됩니다. 개발팀은 컨테이너화를 통해 더욱 신속하게 작업을 진행하고, 효율적으로 소프트웨어를 배포하며, 전례 없는 수준의 확장성을 확보할 수 있게 되었습니다. 그동안 컨테이너화된 워크로드를 실행하는 방법에 관해 많은 경험을 쌓으면서 Google은 커뮤니티에 계속 이 지식을 공유해 왔습니다. 초창기에 cgroup 기능을 Linux 커널에 제공한 것부터 내부 도구의 설계 소스를 Kubernetes 프로젝트로 공개한 것까지 공유의 사례는 다양합니다.

## 주요 특징

### 일관성 있는 환경

개발자는 컨테이너를 이용해, 다른 애플리케이션과 분리된 예측 가능한 환경을 생성할 수 있습니다. 컨테이너는 애플리케이션에 필요한 소프트웨어 종속 항목(프로그래밍 언어 런타임 및 기타 소프트웨어 라이브러리의 특정 버전 등)도 포함할 수 있습니다. 개발자의 관점에서 이 모든 요소는 애플리케이션이 배포되는 최종 위치에 관계없이 항상 일관성이 있습니다. 그 결과 자연히 생산성이 향상될 수밖에 없습니다. 개발자와 IT 운영팀이 버그를 잡고 환경 차이를 진단하던 시간을 줄이고 사용자에게 신규 기능을 제공하는 데 집중할 수 있기 때문입니다. 또한 개발자가 개발 및 테스트 환경에서 세운 가정이 프로덕션 환경에서 그대로 실현될 것이기 때문에 버그 수 자체도 감소합니다.

### 폭넓은 구동 환경

컨테이너는 Linux, Windows, Mac 운영체제, 가상 머신, 베어메탈, 개발자의 컴퓨터, 데이터 센터, 온프레미스 환경, 퍼블릭 클라우드 등 사실상 어느 환경에서나 구동되므로 개발 및 배포가 크게 쉬워집니다. 컨테이너용 Docker 이미지 형식은 워낙 널리 사용되기 때문에 이동성도 매우 뛰어납니다. 소프트웨어 구동 환경이 무엇이든 컨테이너를 사용할 수 있습니다.

### 격리

컨테이너는 CPU, 메모리, 스토리지, 네트워크 리소스를 OS 수준에서 가상화하여 개발자에게 기타 애플리케이션으로부터 논리적으로 격리된 OS 샌드박스 환경을 제공합니다.
|  | Container 장점 | VM 장점 |
|--| :------------: | :-----: |
| 일관성 있는 런타임 환경 | ✓ | ✓ |
| 애플리케이션 샌드박스화 | ✓ | ✓ |
| 디스크 용량 절감 | ✓ |  |
| 낮은 오버헤드 | ✓ |   |

## 주요 기술

### Container Engine

- Docker : 다소 무거운 프로세스와 Root 로 실행된는 구조로 보안적 취약성 존재
- 대체 엔진 : ContainerD, Cri-O, runC

### Container Orchestration

Workload(Application)가 실행되는데 있 관어 필요한 NW, Storage, Resource등 필요한 기능을 가상화 기술을 통해서  
Isolation 모드로 지원하며,  Instance의 Life-Cycle을 관리 할 수 있도록 해주는 플랫폼.  그 외 개발/운영에 필요한 Tool과 API를 제공함

- kubernetes
- openshift
- dc/os + marathon framework
- docker swarm

## Container Build

### Dockerfile

> {..} 내용은 사용자 정의 항목

```Dockerfile
FROM {Container Registry URI}/{Project Name}/{Repository Name}:{Tag}

# Container에 필요한 설치 설정 등을 위한 Shell Command 실행
# 여러 명령어 블럭 실행 가능
RUN {Shell Command}

USER {user:[group]}

# 작업되는 실행 경로 설정
# 여러 명령어 블럭 실행 가능
WORKDIR {/the/workdir/path}

# Container OS에 환경변수 설정
# 여러 명령어 블럭 실행 가능
ENV {ENV-KEY} {Value}

# Container에 파일 복사
# 여러 명령어 블럭 실행 가능
ADD {src} {destination}

# Container에 파일 복사
# 여러 명령어 블럭 실행 가능
COPY {src} {destination}

# Container에 필요한 설치 설정 등을 위한 Shell Command 실행
# 여러 명령어 블럭 실행 가능
RUN {Shell Command}

# Continaer에서 사용되는 port를 외부로 노출시킨다.
# ex) springboot port 8080
EXPOSE 8080
# Container에서 추가적인 port를 오출시키는 경우 추가 지정
EXPOSE 9090

# 선택사항으로 Container 시작을 위한 기본 실행 명령어
ENTRYPOINT {Shell Command}

# 선택사항으로 Container 시작을 위한 ENTRYPOINT에 확장 명령어 처리
# ENTRYPOINT 없는 경우 전체 실행 명령어 지정 가능
# Docker run에 의해 override되는 영역으로 재정의 가능 함
CMD { Shell command extending to ENTRYPOINT }
```

1. FROM : 작성하고자 하는 Container의 기준/기본 OS설정  
   . Container Registry URI : Container 저장소 서비스 주소  
   . Project : Container 그룹을 의미하며, 주로 사용자 권한을 Project 단위로 관리함  
   . Repository : Container 저장공간  
   . Tag: 동일한 Container 저장공간에 세부적인 버전을 구분하기 위한 정보
   . AS [name] 으로 Dockerfile 의 Container를 이름으로 지정하여 COPY --from으로 복사시 Source 위치를 지정할 수 있음
2. RUN : Container 빌드에 필요한 Shell Command 처리
3. USER : ENTRYPOINT, CMD 실행시 적용할 사용자 지정. RUN으로 사용자 추가필요
4. WORKDIR : RUN 및 ENTRYPOINT, CMD 실행 경로 지정
5. COPY : source에서 destination으로 복사. --from을 사용하여 이름으로 지정된 다른 Container를 Source로 지정할 수 있음.
6. Add : COPY와 동일한 기능을 수행하며, **source를 URL**로 지정할 수 있으며, tar파일인 경우 자동으로 압축 해재하여 복사한다.
7. ENTRYPOINT : 선택사항으로 Container가 실행될 때 최초 실행 될 때 사용되는 명령어
8. CMD :  선택사항으로 Container가 실행될 때 최초 실행 될 Command line을 확장하는 방법임  
   ENTRYPOINT가 있는 경우 추가적인 argument가 전달되며, ENTRYPOINT가 없는 경우 직접 실행 명령어를 지정해도됨

### Container 빌드 구성

1. 단순 Container 개발 : 이미 빌드된 App와 Middleware 등의 설치를 위한 방법  

   ``` Dockerfile
   #Springboot jar 예제
   FROM openjdk:11
   # 작업 경로 생성
   RUN mkdir /app
   # 작업/현재 경로 설정 cd와 같은 기능
   WORKDIR /app

   ARG JAR_FILE=target/*.jar
   EXPOSE 8080
   COPY ${JAR_FILE} /app/app.jar
   ENTRYPOINT ["java","-jar","/app/app.jar"] 
   ```

2. Stage Build를 이용한 개발: GitAction, GitLab CI, Circle CI 등에 사용되며, 빌드 환경이   다양한 경우 Build 용 Container와 Runtime Container를 분리하여 처리 함으로써, 불필요한 내용을  RunTime Container에서 제외하여 크기 축소 및 실행(Bootstrap)을 빠르게 처리함

   ```Dockerfile
   # build에 사용할 기준 Container 선언. 
   # as [Name]으로 빌드 컨테이너를 저장소로 사용하기 위한 이름 지정
   FROM maven:3.8.1-jdk-11 AS build

   # 필요한 파일을 local에서 container로 복사
   COPY src /usr/src/app/src
   COPY pom.xml /usr/src/app
   # RUN mvn -f /usr/src/app/pom.xml clean dependency:go-offline -B
   # maven build를 실행
   RUN --mount=type=cache,target=~/.m2 mvn -f /usr/src/app/pom.xml clean package -DskipTests
   
   # Target 컨테이너의 기준 container 선언
   FROM openjdk:11

   # 작업 경로 생성
   RUN mkdir /app
   # 작업/현재 경로 설정 cd와 같은 기능
   WORKDIR /app

   # 필요한 파일을 build 컨테이너에서 target으로 복사
   # 'build'는 위에서 선언한 컨테이너 이름
   COPY --from=build /usr/src/app/target/*.jar /app/app.jar
   # 외부로 노툴할 port 
   EXPOSE 8080
   #실행 명령어
   ENTRYPOINT ["java","-jar","/app/app.jar"]
   ```

### Docker Command

1. build

   ``` sh
   docker build -t [repository uri]/[project name]/[container name]:[tag] .
   docker build .
   # tag 없이 빌드된 경우 docker images로 [image id]를 확인히여 tagging할 수 있음
   ```

2. tag : Container 별칭으로서, 버전을 구분하기위해 주로 사용.

   ``` sh
   docker tag [image id] [repository uri]/[project name]/[container name]:[tag]
   docker tag [repository uri]/[project name]/[container name]:[old tag] [repository uri]/[project name]/[container name]:[new tag]
   ```

3. push : 해당 Container를 서버 저장소(Registry)에 저장(login 필요)  
   서버 주소와 tag의 repository uri가 동일해야 함

   ``` sh
   docker push [repository uri]/[project name]/[container name]:[tag]
   ```

4. run : [Container를 실행](https://docs.docker.com/engine/reference/run/)

   ``` sh
   docker run \
      # Detached after run \
      -d \ 
      --name [container instance name] \
      # volume mount \
      -v [local volume]:[container path to mount] \
      # container 환경변수 선언 \
      -e "key=value" \
      # port mapping/forward \
      -p [local port]:[container port] \
      # 실행할 Container Image URI \
      IMAGE[:TAG|@DIGEST] \
      # 지정할 경우 Dockerfile의 CMD 블럭 대채(선택 사항) \
      [command for CMD(optional)]
   ```

5. logs : container stdout 확인
   - --follow, -f: 연속해서 로그 보기
   - --tail, -n : 마지막 로그 줄 숫자

::: tip 참조

- [https://cloud.google.com/containers/?hl=ko](https://cloud.google.com/containers/?hl=ko)
- [https://cloud.google.com/learn/what-are-containers?hl=ko](https://cloud.google.com/learn/what-are-containers?hl=ko)
- [https://www.samsungsds.com/kr/insights/docker.html](https://www.samsungsds.com/kr/insights/docker.html)
:::

<Comment />
