# Jupyter Hub

Jupyter Hub 는 multi user 에게 Jupyter Notebook 을 제공하는 좋은 방안이다. 또한, 단일 사용자 Jupyter Notebook 의 다수의 인스턴스를 생성 및 관리할 수 있으며, Proxy 처리까지 담당하는 Multi-User Hub 이다.

- 크게 4개의 subsystem 으로 구성.
  - 사용자 환경 UI 제공 및 subsystem 간 연계를 위한 Hub.
  - Client Browser 의 request 처리를 위한 HTTP Proxy.
  - multiple single-user Jupyter notebook 서버를 관리하는 Spawner.
  - 사용자 제어를 위한 Authentication class.

<img src="https://jupyterhub.readthedocs.io/en/stable/_images/jhub-fluxogram.jpeg" width="600px" height="450px" title="hub-arch" alt="hub-arch"></img>

> Jupyter Hub Docs 참조
<https://jupyterhub.readthedocs.io/en/stable/index.html>


## Jupyter Hub for kubernetes Project

Jupyter Hub for kubernetes Project 는 Cloud / On-premise 의 기존 k8s 환경에서 self managed JupyterHub를 설정하고 대규모 사용자 그룹을 지원하기 위한 Project. 특정 CSP 업체와 관련이 없으며, Helm Chart Version 을 통하여 제공. (k8s ver.> = 1.14 / Helm >= 2.16)

- Architecture
  - Proxy, Hub 등의 사용자 request 처리를 위한 서비스 동일
  - 관리자 지정 Docker Image 를 가져오기 위한 Puller 및 Resource 관리를 위한 Idle Culler 내장

<img src="https://zero-to-jupyterhub.readthedocs.io/en/stable/_images/architecture.png" title="hub-k8s-arch" alt="hub-k8s-arch"></img>

- 주요 특징
  - helm 배포시 사용되는 config.yml 파일을 수정하여 hub, singleuser, proxy 등 설정
  - nbgitpuller 를 사용하여 git 과 동기화 가능
  - 일반적으로 사용자가 직접 conda kernel 을 구성
  - profileList 를 정의하여 docker image, gpu, volume 등 별도 환경 구성
  - 사용자 로그인 및 server 시작시 profileList 중에서 1개를 선택 가능하며, 사용자별 Notebook Server 하나만 생성 가능
  - 사용자 ID 로 Notebook Server Pod 생성 

> Jupyter Hub for kubernetes Docs 참조
<https://zero-to-jupyterhub.readthedocs.io/en/stable/index.html>


## Setup Jupyter Hub

- helm install 및 upgrade 를 통하여, Jupyter Hub for kubernetes 관리
- 설치 환경
  - k8s v1.19.7
  - helm v3.5.2
  - jupyter hub v0.11.1
> Install Jupyter Hub 참조
<https://zero-to-jupyterhub.readthedocs.io/en/stable/jupyterhub/installation.html>

- helm upgrade script
```sh
helm upgrade --cleanup-on-fail \
--install $RELEASE jupyterhub/jupyterhub \
--namespace $NAMESPACE \
--create-namespace \
--version=0.11.1 \
--values config.yaml
```

- 배포 내역
```
$ kubectl get deploy

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
hub              1/1     1            1           11d
proxy            1/1     1            1           11d
user-scheduler   2/2     2            2           11d

$ kubectl get ds
NAME                      DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
continuous-image-puller   2         2         2       2            2           <none>          11d

$ kubectl get svc

NAME                      TYPE           CLUSTER-IP       EXTERNAL-IP          PORT(S)                      AGE
hub                       ClusterIP      10.100.224.155   <none>               8081/TCP                     11d
proxy-api                 ClusterIP      10.100.61.200    <none>               8001/TCP                     11d
proxy-public              LoadBalancer   10.100.234.106   <EXTERNAL-IP>        443:31151/TCP,80:30780/TCP   11d
```


### Hub with Notebook Official Image

config.yaml 의 singleuser configuration 을 활용하여, Jupyter Notebook Official Image 기반 기본 Profile 생성

- Jupyter Notebook Official Image Dockerfile 기본 설명
  - ubuntu base image 기반, conda 및 python 개발 환경 설치
  - jovyan user 의 home directory 에 작업 환경 구축
  - notebook, jupyterhub, jupyterlab 을 기본적으로 설치
  - Image 에 포함되어 있는 별도의 shell script 를 실행하여, container 구동

```Dockerfile
...

RUN conda install --quiet --yes \
    'notebook=6.3.0' \
    'jupyterhub=1.3.0' \
    'jupyterlab=3.0.14' && \
    conda clean --all -f -y && \
    npm cache clean --force && \
    jupyter notebook --generate-config && \
    jupyter lab clean && \
    rm -rf /home/$NB_USER/.cache/yarn && \
    fix-permissions $CONDA_DIR && \
    fix-permissions /home/$NB_USER

...

```


- config.yaml 구성
  - singleuser 에서 default image 설정
  - profileList 를 통하여, profile 별 관리자 지정 image 설정 가능
  - kubespawner 에서 k8s 설정을 override 하여, image / resource / volume 등을 별도 관리

```yaml
singleuser:
  image:
    name: jupyter/minimal-notebook
    tag: latest
  storage: 
    type: none
  cpu:
    limit: 0.5
    guarantee: 0.05
  memory:
    limit: 1G
    guarantee: 256M

  profileList:
    - display_name: "Minimal environment"
      description: "Default env."
      default: true
    - display_name: "Data Science environment"
      description: "Data Science env."
      kubespawner_override:
        # Data Science 를 위한 Official Image
        image: jupyter/datascience-notebook:latest
        # Resources
        cpu_limit: 1
        cpu_guarantee: 0.05
        mem_limit: 2G
        mem_guarantee: 256M
        # Volumes
        volume_mounts:
          - name: jupyter-notebook-tf
            mountPath: /home/jovyan
        volumes:
          - name: jupyter-notebook-tf
            persistentVolumeClaim:
              claimName: jupyter-notebook-tf
```

- Jupyter Hub Profile List 조회
![](../../images/jhub-profile-official.png)



### Hub with Notebook Custom Image

Official Image 가 아닌, 사용자가 직접 정의한 Dockerfile 및 command script 등으로 Custom Notebook Image 구성이 되어 있는 경우, Jupyter Hub 에서 구동하기 위해 확인해야 할 항목.

1. jupyterhub package 설치
    - JupyterHub 의 Notebook Server Pod 생성 시, Notebook Image 에 설치된 <b>jupyterhub-singleuser</b> command 를 통하여 실행.
    - Official Image 에는 jupyterhub package 가 내장되어 있어, 별도의 설정 변경 없이 Jupyter Hub 에서 Notebook 실행 가능.
    - *jupyterhub-singleuser 는 jupyterhub package 설치를 통하여 실행 가능하므로, custom image 에 jupyterhub package 설치 필요.*

- Custom Notebook Image Dockerfile
  - ubuntu base image 기반으로, python3 설치 및 jupyter notebook / lab 이 설치되어 있다고 가정.
  - <u>*Dockerfile 혹은, k8s cmd script 에서 jupyterhub package 설치 추가.*</u>

```Dockerfile
FROM ubuntu:18.04

USER root

RUN apt-get update
RUN apt-get install -y python3 python3-pip openjdk-8-jre wget
RUN ln -s /usr/bin/python3 /usr/bin/python
RUN ln -s /usr/bin/pip3 /usr/bin/pip

RUN python -m pip install --upgrade pip
RUN python -m pip install jupyter -U && pip install jupyterlab
RUN jupyter notebook --generate-config --allow-root -y

# container 에 jupyterhub package install 추가 필요
RUN python -m pip install jupyterhub

COPY run.sh /usr/local/bin/

EXPOSE 8888

WORKDIR /root

CMD [ "/bin/sh", "-c", "jupyter notebook --allow-root --ip=0.0.0.0 --NotebookApp.token='' --notebook-dir=/root"]

```

2. 기존에 root 권한으로 Notebook 실행 시
    - Official Image 의 경우, jovyan 이라는 공통 user 를 생성하여 Notebook Server 를 구동하며, jupyterhub-singleuser command 실행 시에도 별도의 옵션 지정이 필요 없음.
    - uid / gid 설정을 통하여, securityContext 설정 변경.
    - *Custom Image 의 경우, root 로 그대로 실행하기 위해서는, <b>--allow-root</b> option 을 kubespawner_override cmd 에 설정해주어야 함.*

- config.yaml
    - kubespawner_override 수정

```yaml
...

    - display_name: "Custom Notebook without conda"
      description: "without conda"
      kubespawner_override:
        cpu_limit: 1
        cpu_guarantee: 0.1
        mem_limit: 2G
        mem_guarantee: 512M
        # root 권한 실행을 위한 override 설정 추가
        uid: 0
        gid: 0
        cmd: ["jupyterhub-singleuser", "--allow-root", "--ip=0.0.0.0"]
        image: htdp1/jupyter-notebook-custom:latest
        image_pull_policy: Always
        volume_mounts:
          - name: jupyter-notebook-tf
            mountPath: /root
        volumes:
          - name: jupyter-notebook-tf
            persistentVolumeClaim:
              claimName: jupyter-notebook-tf

...
```


## Migration to Jupyter Hub

기존에 사용하던 Notebook 혹은 Lab 개발 Container 환경을, Jupyter Hub 에서 동일하게 사용하기 위해 확인할 항목.  
기존의 Container 환경은 Docker commit 을 통하여 Image 를 생성하고, 이를 Jupyter Hub 에서 구동한다고 가정.

### Docker Commit Image 구동

> Kubernetes 에 구동 되는 Pod 의 Docker commit 참조
<https://stackoverflow.com/questions/49481849/is-there-a-way-to-download-the-container-image-from-a-pod-in-kuberentes-environm>


### Jupyter Lab 호환성
