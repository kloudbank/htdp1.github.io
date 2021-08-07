# IDE 구성
본 가이드에서는 [Visual Studio Code](https://code.visualstudio.com/)를 활용하여 설명하고 있어, Springboot을 위한 설정과 환경변수 내용을 설명 합니다.

## Step 1: JDK 11 설치
- jdk-11.0.11-x64 MSI : redhat 가입 필요. [https://developers.redhat.com/products/openjdk/download]()
- JDK_HOME 등록
- JAVA_HOME 등록

## Step 2: Maven 설치

- maven 설치 : download(https://mirror.navercorp.com/apache/maven/maven-3/3.8.1/binaries/apache-maven-3.8.1-bin.zip)
- unzip : c:\maven
- 환경변수 설정: MAVEN_HOME 등록
- Path 추가 :%MAVEN_HOME%\bin
- SSL Invalidate 설정 : [TODO]

## Step 3: VSCode extension 설치

[https://code.visualstudio.com/docs/java/extensions]()

- [Language Support for Java(TM) by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.java)
- [Debugger for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-debug)
- [Java Test Runner](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-test)
- [Maven for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-maven)
- [Project Manager for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-dependency)
- [Visual Studio IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode)
- [Spring Boot Tools](https://marketplace.visualstudio.com/items?itemName=Pivotal.vscode-spring-boot)
- [Spring Initializr Java Support](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-initializr)
- [Spring Boot Dashboard](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-boot-dashboard)

::: tip
export extension list
``` sh
code --list-extensions > extension.txt
```
import extension list
```sh
# powershell
type extension.txt |  % { "code --install-extension $_" }
#linux
cat extension.txt | xargs -L 1 echo code --install-extension
```
:::



## Step 4: Run/Debug 설정

1. [download sample project](https://github.com/htdp1/sam-springboot/archive/refs/tags/boilerplate.zip)
2. 