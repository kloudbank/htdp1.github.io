# Basics

Flux v2 의 Core Concepts 및 GOTK (GitOps Toolkit) components 정리.

## Core Concepts

- Source
  - Flux 의 source 는 repository 의 상태를 지속적으로 확인하기 위해 정의할 수 있는, Flux 의 구성 resource 를 의미한다.
  - 정의된 interval 간격으로 변경 사항이 있는지 확인하고, 새로운 version 이 확인되면 Flux component 가 실행할 수 있는 artifact 를 cluster 에 내부적으로 생성한다.
  - Kubernetes custom resource 로 생성하며, 아래와 같은 resource 를 정의할 수 있다.
    - GitRepository, HelmRepository, Bucket (Object Storage).

- Reconcilation
  - Flux 의 reconcilation 은 Flux source 가 정의한 resource 가 생성한 artifact 의 상태와, 현재 실행 중인 상태 (k8s cluster, infra) 가 일치하는지 확인하는 것을 의미한다.
  - 위의 확인 과정에서 일치하지 않을 경우, source 의 유형에 맞는 작업을 수행하도록 정의할 수 있다.
    - Kustomization, HelmRelease, Bucket reconcilation 수행.
  - 특히, Kustomization 의 경우, kustomization.kustomize.toolkit.fluxcd.io 의 custom resource 이며, kustomize 릍 통한 k8s object 배포를 위해 정의할 수 있으며, repository 에 kustomization.yml 이 없더라도 내부적으로는 kustomize 를 통하여 모든 k8s object 를 배포한다.
  <https://fluxcd.io/docs/faq/#kustomize-questions>

- Bootstrap
  - FluxCD 의 구성 component 들을 k8s 에 설치하는 방식 또한, GitOps 방식으로 프로세스를 실행하게 되는데, 이를 bootstrap 이라 한다.
  - FluxCD 의 GitHub main 저장소에 있는 manifest file 을 내려 받아, 사용자의 cluster 에 source repository 에 저장하고, flux 구성 요소의 설정 변경 및 재배포를 Flux Reconcilation 을 통하여 수행한다.
  - 아래 tool 을 설치하여, Flux bootstrap 을 실행할 수 있다.
    - <b>Flux CLI</b> or Terraform Provider

## GOTK Components

GitOps Toolkit 은 Flux v2의 런타임을 구성하는 API 및 Controller Set 이다.  
API는 Kubernetes custom resource 로 구성되며, custom resource 정의 를 직접 수정하여 cluster 에 배포할 수도 있다.

- <b>Source Controller</b>
  - GitRepository CRD
  - HelmRepository CRD
  - HelmChart CRD
  - Bucket CRD
- <b>Kustomize Controller</b>
  - Kustomization CRD
- Helm Controller
  - HelmRelease CRD
- Notification Controller
  - Provider CRD
  - Alert CRD
  - Receiver CRD
- <b>Image reflector & automation controller</b>
  - ImageRepository CRD
  - ImagePolicy CRD
  - ImageUpdateAutomation CRD

FluxCD 에서 제공하는 모든 controller 를 모두 배포하면, 위 목록의 6개의 deployment 가 배포되고, 관련 CRD 가 cluster 에 정의된다.
아래, controller set 중에서, source 관련 custrom resource 의 artifact 생성을 하는 역할을 <b>Source Controller</b> 가 수행하며, reconcilation 의 역할을 수행하는 것이, <b>Kustomize Controller</b>, Helm Controller 이다.

***
| <small>정확히 확인하지는 않았지만,,, git repository 의 k8s 관련 yml 정의와, helm release automation 을 수행하는, 즉, kustomize / helm 의 reconcilation 을 담당하는 controller 는 각각 따로 있지만, Object Storage 의 reconcilation 을 담당하는 controller 는 따로 없다.</small>
  <small>Object Storage 의 경우에는, artifact revision 재생성하는 작업 이후에, 배포 과정이 따로 필요하지 않으므로, Bucket custom resource 정의만으로 source resource 관리 및 reconcilation 을 모두 수행할 것이다.</small>
***

그 외, Notification Controller 는 정의된 Alert custom resource 를 통하여 3rd. party 연계 등을 위한 부가적인 기능을 제공한다.

<b>Image reflector & automation controller</b> 는 하나의 set 이며, container image 의 push 이력 및 tag 적용 policy 등을 관리하고, 실제로 deploy automation 까지 수행한다.

#### <u>*Source controller, Kustomize controller, Image reflector & automation controller*</u> 에 대한 좀 더 자세한 정리 내역이다.

### Source Controller

Source Controller 는 deployment 로 배포되며, 아래와 같이 cluster 에 사용자가 정의한 source custom resource 를 API 를 통해 감지하여, 변경 사항이 있으면 Artifact 를 Local 에 생성한다.

<img src="https://fluxcd.io/img/source-controller.png" />

- Features
  - source custom resource 정의 validation check
  - source (SSH, user/password, API token) 인증
  - 소스 신뢰성 검증 (PGP), 
  - 업데이트 정책 (semver) 기반, 소스 변경 감지
  - 온 디맨드 및 일정에 따라 source resource fetch
  - 소스 변경 및 상태 변경에 대한 notification
    - notification-controller 에 알려, 3rd. party 연계 가능.
  - resource 를 tar.gz > yaml 형태로 packaging 하여 local 에 저장
    - 아래와 같이 artifact 를 물리적인 파일로 생성.

```sh
$ ls -tlra /data/gitrepository/flux-system/flux-system/

lrwxrwxrwx    1 controll 1337            91 Jun  8 08:53 latest.tar.gz -> /data/gitrepository/flux-system/flux-system/20ebd9bf70ecc2a061cf2ed0cdff9fd7bc3ab28b.tar.gz
-rw-r--r--    1 controll 1337         26665 Jun  8 08:53 20ebd9bf70ecc2a061cf2ed0cdff9fd7bc3ab28b.tar.gz
```


### Kustomize Controller

Kustomize Controller 는 Source Controller 가 생성한 artifact 와 현재 k8s cluster 의 상태를 비교하고, k8s manifest 를 kustomize 를 사용하여 배포한다.

<img src="https://fluxcd.io/img/kustomize-controller.png" />

- Features
  - k8s cluster 의 reconcilation 을 담당하며, 여러 개의 source resource 변경 감지도 가능.
  - Kustomize 를 사용하여 배포하기 위한 manifest 를 생성.
  - Kubernetes API에 대한 manifest validation check.
  - Service Account 로 Impersonate,,? (multi-tenancy RBAC)
  - 배포된 workload health check.
  - 정의된 k8s manifest 의 관계에 따라, 순서에 맞게 배포.
  - source 에서 제거된 resource prune (Garbage Collection)
  - cluster 상태 변경 notification
    - notification-controller 에 알려, 3rd. party 연계 가능.


### Image reflector & automation controller

image-reflector-controller와 image-automation-controller는 set 로 배포된다.  
새로운 Container Image 가 감지되면, Git Repository 의 manifest 에 지정된 image tag 를 업데이트 하고, 이를 통해 Kustomization 의 reconcilation 이 수행되어질 수 있도록 한다.

<img src="https://fluxcd.io/img/image-update-automation.png" />

- Features
  - image-reflector-controller 는 ImageRepository 를 scan 하고, Kubernetes resource 에 image metadata 를 반영하여, automation controller 가 실행되도록 한다.
  - image-automation-controller 는 scan 한 최신 image metadata 를 기반으로, 설정된 GitRepository 의 yaml 을 update 및 commit / push 를 수행한다.

