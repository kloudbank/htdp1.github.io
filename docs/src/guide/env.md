# 개발 환경

## IDE

#### 1. VS Code
- Visual Studio Code 설치
<https://code.visualstudio.com/download>

#### 2. Java 개발 환경
- OpenJDK 11 설치
<https://jdk.java.net/archive/>
- VS Code **Java Extension Pack** 설치
<https://code.visualstudio.com/docs/java/extensions>
  - VS Code Java Development Tutorial
<https://code.visualstudio.com/docs/java/java-tutorial>

#### 3. Spring Boot 개발 환경
- VS Code **Spring Boot Extension Pack** 설치하여, 아래 extension이 일괄 적용
  - Spring Boot Tools
  - Spring Initializr
  - Spring Boot Dashboard
<https://code.visualstudio.com/docs/java/java-spring-boot>

## Container 개발 환경

#### 1. Docker, kubectl
- Dockerhub 계정 생성 (계정 없을 경우)
<https://hub.docker.com/>
- Docker Desktop 설치
<https://docs.docker.com/desktop/>

#### 2. Kubernetes Object 관리
- kustomize 설치
<https://kubectl.docs.kubernetes.io/installation/kustomize/>

- kustomize를 이용한 k8s object 선언형 관리
<https://kubernetes.io/ko/docs/tasks/manage-kubernetes-objects/kustomization/>

  - kustomization 파일을 포함하는 디렉터리 내의 리소스 확인
```
kubectl kustomize <kustomization_directory>
```
  - 리소스를 적용하려면 kubectl apply를 --kustomize 또는 -k 플래그와 함께 실행
```
kubectl apply -k <kustomization_directory>
```
