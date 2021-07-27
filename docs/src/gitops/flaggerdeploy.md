# Flagger on EKS App Mesh

AWS 에서 제공하는 Service Mesh 인 Amazon App Mesh 에서, Flagger 를 활용한 Kubernetes Object Delivery 환경 구성 및 FluxCD 기반 Amazon EKS GitOps 환경과의 통합.

- App Mesh integration with Amazon EKS

  - Kubernetes custom resources : mesh, virtual nodes, routers, services 활용 (외부 노출을 위한 Virtual Gateway 는 제외)
  - CRD controller : App Mesh control plane 과 custom resource 의 동기화
  - Admission controller : Envoy sidecar injection 과 App Mesh virtual nodes 에 service (pod) assign
  - Telemetry service : appmesh 에서 제공하는 prometheus 활용
  - Progressive delivery operator : Flagger instance 를 활용한 canary release automation


<img src="https://eks.handson.flagger.dev/gitops-appmesh-stack.png" />

> EKS GitOps Handson 참조
<https://eks.handson.flagger.dev/profile/#app-mesh-profile>


## Prerequisite

- GitOps Pipeline
  - 사전에 구성한 Amazon EKS cluster (ver. >= 1.16)
  - 사전에 구성한 ECR
  - 사전에 구성한 AWS Code Pipeline (CodeCommit + CodeBuild)
  - FluxCD 기반 k8s manifest repository 의 Pull based Deployment 환경

- Delivery Process
  - App Mesh Component 및 Prometheus 설치
  - Flagger 설치
> Flagger Official Docs 참조
<https://docs.flagger.app/install/flagger-install-on-eks-appmesh>

### Install App Mesh Components

- Helm repository 추가
```bash
helm repo add eks https://aws.github.io/eks-charts
```

- App Mesh CRD 설치 및 namespace 생성:

```bash
kubectl apply -k github.com/aws/eks-charts/stable/appmesh-controller//crds?ref=master

kubectl create ns appmesh-system
```

- App Mesh controller helm install

```bash
helm upgrade -i appmesh-controller eks/appmesh-controller \
--wait --namespace appmesh-system
```

- App Mesh Prometheus helm install
: Flagger 의 canary analysis 를 위해 필요한, App Mesh metric 수집을 위해 설치

```bash
helm upgrade -i appmesh-prometheus eks/appmesh-prometheus \
--wait --namespace appmesh-system
```


### Install Flagger

- Helm repository 추가
```bash
helm repo add flagger https://flagger.app
```

- Flagger CRD 설치
: Canary, AlertProvider, MetricTemplate,,

```bash
kubectl apply -f https://raw.githubusercontent.com/fluxcd/flagger/main/artifacts/flagger/crd.yaml
```

- App Mesh namespace 에 flagger helm install
```bash
helm upgrade -i flagger flagger/flagger \
--namespace=appmesh-system \
--set crd.create=false \
--set meshProvider=appmesh:v1beta2 \
--set metricsServer=http://appmesh-prometheus:9090
```

- Monitoring 을 위한, Flagger Grafana helm install
```bash
helm upgrade -i flagger-grafana flagger/grafana \
--set url=http://prometheus:9090
```


## Service Mesh Canary release

Service Mesh 기반 Flagger 의 Canary Release 에 대한 구성 내역.
Flagger 의 Canary custom resource 를 정의하여, Amazon App Mesh 기반의 canary release automation process 를 구성하였다.

> Flagger Official Docs 참조
<https://docs.flagger.app/tutorials/appmesh-progressive-delivery>


### App Mesh + Flagger

Flagger 는 Canary resource 에 정의된 target deployment 및 hpa 를 기반으로, primary 기준이 되는 deployment, service, hpa 등을 생성하는 것 뿐 아니라, 정의된 provider 에 맞는 service mesh 에 필요한 custom resource 를 생성한다.

App Mesh 의 경우, 수동으로 환경을 구성할 경우, Mesh, VirtualNode, VirtualService, VirtualRouter 등을 직접 k8s manifest 정의하고 apply 하여 생성해야 한다.
하지만, Flagger 의 Canary resource 를 활용하여 정의할 경우, 관련된 primary, canary route 를 위한 virtual node, service, router 를 자동으로 생성해주므로, App Mesh 구성을 위해 global 영역의 논리적 경계를 정의하는 mesh 만 직접 생성하였다.

- Mesh resource manifest

```yaml
apiVersion: appmesh.k8s.aws/v1beta2
kind: Mesh
metadata:
  name: global
spec:
  namespaceSelector:
    matchLabels:
      appmesh.k8s.aws/sidecarInjectorWebhook: enabled
  egressFilter:
    type: ALLOW_ALL
```

- Virtual node, router, service 를 직접 생성할 경우 예시

```yaml
---
# VirtualNode: k8s service 의 logical pointer 역할
apiVersion: appmesh.k8s.aws/v1beta2
kind: VirtualNode
metadata:
  name: mariadb-shop
spec:
  podSelector:
    matchLabels:
      app: mariadb-shop
  listeners:
  - portMapping:
      port: 3306
      protocol: tcp
  serviceDiscovery:
    dns: # service 지정
      hostname: mariadb-shop.shop-infra.svc.cluster.local.

---
# VirtualRouter: VirtualService 의 traffic 을 VirtualNode 로 routing
apiVersion: appmesh.k8s.aws/v1beta2
kind: VirtualRouter
metadata:
  name: mariadb-shop
spec:
  listeners:
  - portMapping:
      port: 3306
      protocol: tcp
  routes:
  - name: route-to-mariadb-shop
    tcpRoute:
      action:
        weightedTargets:
        - virtualNodeRef:
            name: mariadb-shop
          weight: 1

---
# VirtualService: 실제 k8s service 를 추상화한 object. service name 과 동일하게 생성
apiVersion: appmesh.k8s.aws/v1beta2
kind: VirtualService
metadata:
  name: mariadb-shop
spec:
  awsName: mariadb-shop.shop-infra
  provider:
    virtualRouter:
      virtualRouterRef:
        name: mariadb-shop
```


- App Mesh Traffic Flow 예시

<img src="https://docs.aws.amazon.com/app-mesh/latest/userguide/images/simple-app-with-mesh-diagram.png" />

> Amazon App Mesh Official Docs 참조
<https://docs.aws.amazon.com/app-mesh/latest/userguide/what-is-app-mesh.html>


### Flagger Canary resource

기존에 FluxCD 기반으로 배포되어 있던, deployment, hpa 구성을 target 으로 하는 Canary Resource 를 생성한 내역

- Canary resource manifest 예시
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: <name>
spec:
  provider: appmesh:v1beta2
  # target deployment 정의
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: <name>
  progressDeadlineSeconds: 300
  # target hpa 정의
  autoscalerRef:
    apiVersion: autoscaling/v2beta2
    kind: HorizontalPodAutoscaler
    name: <name>
  # expose 를 위한 service 정의 (ClusterIP)
  service:
    port: <port>
    backends: # App Mesh 일 경우, virtual service egress 허용을 위해 추가해주어야 하는 내용
      - arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualService/mariadb-shop.shop-infra
      - arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualService/rabbitmq.shop-infra
      - arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualService/redis-session.shop-infra
  # canary analysis 정의 영역
  skipAnalysis: false # true 일 경우, 곧바로 canary promotion
  analysis:
    # schedule interval (default 60s)
    interval: 30s
    # max number of failed metric checks before rollback
    threshold: 3
    # 도달하기 위한 최대 가중치 값 정의, percentage (0-100)
    maxWeight: 80
    # traffic 가중치 증가 단위, percentage (0-100)
    stepWeight: 20
    # App Mesh Prometheus 의 metric check
    ### flagger 의 service mesh metric check 는 기본적으로 아래의 2가지 항목을 제공
    ### request 성공률, duration
    metrics:
    - name: request-success-rate
      # minimum req success rate (non 5xx responses), percentage (0-100)
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      # maximum req duration P99, milliseconds
      thresholdRange:
        max: 500
      interval: 30s
    # 생성한 alert provider 를 reference 로 하여, slack channel 에 message 전송
    ### slack web hook url 기반으로 namespace 에 alert provider 미리 생성함.
    alerts:
      - name: "dev team Slack"
        severity: info
        providerRef:
          name: on-call
          namespace: shop
    # webhook 기반 Testing (optional)
    ### rollout type 으로 정의하여, weight 가 변경될 때 마다, curl command 를 호출하는 url 호출
    ### flagger-loadtester application 을 미리 배포하였음.
    webhooks:
    - name: acceptance-test
      type: rollout
      url: http://flagger-loadtester.shop/
      timeout: 60s
      metadata:
        type: bash
        cmd: "curl -X GET http://account-canary.shop:8180/v1/accounts/events"
```

- Canary resource 생성 시, generate 되는 object 내역
: app name 은 account

```bash
# Flagger canary resource
canary.flagger.app/account

# target deployment, hpa 의 primary object
deployment.apps/account-primary
horizontalpodautoscaler.autoscaling/account-primary

# primary service 와 weight routing 을 위한 canary service
service/account                ClusterIP
service/account-canary         ClusterIP
service/account-primary        ClusterIP

# App Mesh resource, AWS 의 arn 이 부여됨.
virtualnode.appmesh.k8s.aws/account-canary       arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualNode/account-canary_shop
virtualnode.appmesh.k8s.aws/account-primary      arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualNode/account-primary_shop
virtualrouter.appmesh.k8s.aws/account            arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualRouter/account_shop
virtualrouter.appmesh.k8s.aws/account-canary     arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualRouter/account-canary_shop
virtualservice.appmesh.k8s.aws/account           arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualService/account.shop
virtualservice.appmesh.k8s.aws/account-canary    arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualService/account-canary.shop
```

### Automated Canary Promotion

Spring Boot Application 의 application property 를 configmap volume 으로 mount 한 application 의 Canary release demo.
- Test stages
1. k8s manifest git repository 의, spring boot application property 를 수정 후 commit & push.
2. FluxCD 에 의해서, kustomize reconciliation 수행하여, k8s configmap 재생성.
3. Flagger 에서 configmap 의 변경 event 를 감지하여, canary release process 시작.
4. stepWeight 단위 및 interval 간격으로, canary 와 primary 간 traffic 분산 가중치 조절.
4-1. 이상이 있을 경우, canary promotion 없이 process 중단.
4-2. alert provider 에 의해 slack message 수신
5. k8s manifest git repository 의, spring boot application property 올바른 값으로 수정 및 commit & push.
6. 2 ~ 4번 과정 다시 반복.
7. 적합도 테스트 정상 완료 및 canary promotion 수행.
8. alert provider 에 의해 slack message 수신.



## Ingress Canary Release

TBD

