# Basics

Flux GitoOps 제품군이며, Kubernetes operating 을 위한 delivery 도구인, flagger 기본 기능 및 Canary custom resource 상세 정리.

## Introduction

Flagger 는 k8s 에서 실행되는 application 의 release process 를 자동화하기 위한 도구이다. 신규 version application 의 traffic 을 점진적으로 이동시키며, metric 을 기반으로 적합한지 판단하여 production 에 정상적인 application 이 유지될 수 있도록 promotion 여부를 판단한다.

Flagger는 Traffic Routing 을 위해 Service Mesh (App Mesh, Istio, Linkerd) 혹은 Ingress Controller (Contour, Gloo, NGINX, Skipper, Traefik) 를 사용하여 다양한 배포 전략(Canary 릴리스, A/B 테스트, Blue/Green 미러링)을 구현하는 것이 가능하다.

또한, Release version 의 분석을 위해 Prometheus, Datadog, New Relic, CloudWatch, Graphite를 쿼리할 수 있으며, Alert Provider 를 제공하여 Slack, MS Teams, Discord, Rocket 등에 alert 을 발생하는 것이 가능하다.

Flagger 는 아래 3 가지 Custom Resource 를 활용하여 release process 를 구성한다.

- **k8s api resources**

```sh
NAME               APIVERSION            NAMESPACED    KIND
                                                                     
alertproviders     flagger.app/v1beta1   true          AlertProvider
canaries           flagger.app/v1beta1   true          Canary
metrictemplates    flagger.app/v1beta1   true          MetricTemplate
```

위와 같은 custom resource 구성을 선언적 방식으로 관리하며, k8s event 에 반응하여 동작하기 때문에, 이미 사용하고 있는 Flux, JenkinsX, Carvel, ArgoCD 와 같은 GitOps Pipeline 과 함께 사용하는 것이 가능하다.

- **Flagger Overview Diagram**
<img src="https://raw.githubusercontent.com/fluxcd/flagger/main/docs/diagrams/flagger-overview.png" />

> Flagger Official Docs. 참고
<https://docs.flagger.app/>


## Features

아래는 Service Mesh, Ingress Controller 유형 별로 지원 가능한 기능에 대한 정리 내역이다.

- **Service Mesh**
***
| <small>Istio 에서만 가능한 traffic mirroring 의 경우, request traffic 을 copy 하여 Blue / Green 환경에 각각 전송해주는 방식으로, 멱등적이거나 2번 실행하여도 문제가 없는 request 를 활용하여 release version 에 대한 테스트 방식으로 활용할 수 있다.</small>

| Deployment Strategy                        | App Mesh           | Istio              | Linkerd            |  SMI               |  Kubernetes CNI    |
| ------------------------------------------ | ------------------ | ------------------ | ------------------ |  ----------------- |  ----------------- |
| Canary deployments (weighted traffic)      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_minus_sign: |
| A/B testing (headers and cookies routing)  | :heavy_check_mark: | :heavy_check_mark: | :heavy_minus_sign: | :heavy_minus_sign: | :heavy_minus_sign: |
| Blue/Green deployments (traffic switch)    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Blue/Green deployments (traffic mirroring) | :heavy_minus_sign: | :heavy_check_mark: | :heavy_minus_sign: | :heavy_minus_sign: | :heavy_minus_sign: |

| Mertric Check                              | App Mesh           | Istio              | Linkerd            |  SMI               |  Kubernetes CNI    |
| ------------------------------------------ | ------------------ | ------------------ | ------------------ |  ----------------- |  ----------------- |
| Request success rate check (L7 metric)     | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_minus_sign: | :heavy_minus_sign: |
| Request duration check (L7 metric)         | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_minus_sign: | :heavy_minus_sign: |
| Custom metric checks                       | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

<br/>

- **Ingress**

***
| <small>Service Mesh 에 배포되어 있지 않은 경우, Flagger 는 Kubernetes L4 Networking 을 통하여 traffic 처리할 수 있다.</small>
<small>다만, NGINX Ingress Controller 의 경우, L7 metric 기반 request check test 등이 불가능 하다.</small>

| Deployment Strategy                        | Contour            | Gloo               | NGINX              | Skipper            | Traefik            |
| ------------------------------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| Canary deployments (weighted traffic)      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| A/B testing (headers and cookies routing)  | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_minus_sign: | :heavy_minus_sign: |
| Blue/Green deployments (traffic switch)    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

| Mertric Check                              | Contour            | Gloo               | NGINX              | Skipper            | Traefik            |
| ------------------------------------------ | ------------------ | ------------------ | ------------------ |  ----------------- |  ----------------- |
| Request success rate check (L7 metric)     | :heavy_check_mark: | :heavy_check_mark: | :heavy_minus_sign: | :heavy_check_mark: | :heavy_check_mark: |
| Request duration check (L7 metric)         | :heavy_check_mark: | :heavy_check_mark: | :heavy_minus_sign: | :heavy_check_mark: | :heavy_check_mark: |
| Custom metric checks                       | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

<br/>

> Flagger Github 참조
<https://github.com/fluxcd/flagger/blob/main/README.md>



## Canary CRD

Flagger 의 Canary custom resource 를 생성하여, application release version 의 배포 방식을 정의할 수 있다.  
아래는 Canary 생성 시 정의하는 항목에 대한 간단한 정리 내역이다.

### provider

기본적으로, 환경에 맞는 service mesh / ingress controller 를 provider 로 정의한다.

- kubernetes, istio, linkerd, appmesh, nginx, skipper, contour, gloo, supergloo, traefik
- SMI TrafficSplit: smi:v1alpha1, smi:v1alpha2, smi:v1alpha3

```yaml

apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: <name>
spec:
  provider: appmesh:v1beta2

...
```

### target

targetRef 는 Deployment 와 DaemonSet 으로 지정 가능하다.
HPA 가 구성되어 있는 경우, autoscalerRef 에 해당 내용을 정의한다.

```yaml
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: <name>
  autoscalerRef:
    apiVersion: autoscaling/v2beta2
    kind: HorizontalPodAutoscaler
    name: <name>
```

위와 같이 정의한 Canary resource 를 생성하면, 아래처럼 primary deployment, hpa 가 하나씩 더 생성된다.
  
  - deployment/<targetRef.name>-primary
  - hpa/<autoscalerRef.name>-primary

Flagger 는 위처럼 생성한 primary deployment 를 stable release 로 관리하고, 모든 production traffic 을 primary 로 routing 한다. target 에 정의한 deployment 에서 reference 로 사용하고 있는 configmap, secret 역시 마찬가지로 primary 를 생성한다.
target 으로 정의된 deployment, configmap, secret 등에 변경이 발생되면, flagger 는 primary 에도 동일한 변경 사항을 반영하기 위한 promotion 을 진행하게 되며, 이 과정에 canary analysis 를 정의하여, promotion 가능 여부를 판단할 수 있다.


### service

service 를 정의하여, Canary 의 target deployment 가 cluster 내에서 어떤 형태로 노출되어 있는지 정의해야 한다.

```yaml
spec:
  service:
    name: <name>
    port: 9898
    portName: http
    targetPort: 9898
```

위와 같이 정의한 Canary resource 를 생성하면, 아래 처럼 3종류의 service 를 생성한다.  

  - `<service.name>.<namespace>.svc.cluster.local`
  : `selector app=<name>-primary`
  - `<service.name>-primary.<namespace>.svc.cluster.local`
  : `selector app=<name>-primary`
  - `<service.name>-canary.<namespace>.svc.cluster.local`
  : `selector app=<name>`

기본 service / primary service 는 target primary pod 으로 routing 한다. canary analysis 가 진행될 경우, 가중치에 따라 traffic 을 canary service 로 전달하게 되며, 해당 service는 release version 에 의해 생성된 target pod 으로 traffic 을 routing 한다.

- **Endpoints 예시**

```java
NAME                        ENDPOINTS             
account                     192.168.179.185:8180  
account-canary              192.168.156.142:8180  
account-primary             192.168.179.185:8180  
```

또한, Service Mesh 에 배포되어 있는 flagger 의 경우, 해당하는 추상화된 Object 들을 함께 생성한다.

- **App Mesh 예시**

Amazon App Mesh 의 경우, VirtualService 에서 proxy 를 수신하여 가중치 등에 의해 traffic 을 router 로 전달하며, Virtual Rotuter 에서 실제 k8s cluster local service 를 추상화한 Virtual Node 로 분산한다.

```
NAME                                                      ARN                                                                                                    AGE
virtualservice.appmesh.k8s.aws/account                    arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualService/account.shop                    26d
virtualservice.appmesh.k8s.aws/account-canary             arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualService/account-canary.shop             26d

NAME                                                     ARN                                                                                                   AGE
virtualrouter.appmesh.k8s.aws/account                    arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualRouter/account_shop                    26d
virtualrouter.appmesh.k8s.aws/account-canary             arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualRouter/account-canary_shop             26d

NAME                                                    ARN                                                                                                  AGE
virtualnode.appmesh.k8s.aws/account-canary              arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualNode/account-canary_shop              26d
virtualnode.appmesh.k8s.aws/account-primary             arn:aws:appmesh:ap-northeast-2:170247361816:mesh/global/virtualNode/account-primary_shop             26d
```


### status

생성된 canary resource 의 status 를 통하여 release process 가 정상적으로 수행되고 있는지 확인할 수 있으며, success / fail 등의 condition 을 status 에서 관리한다.

- **canary 의 weight 조정 status 및 promotion 여부 실시간 조회**

```sh
$ kubectl get canary account -w

NAME      STATUS      WEIGHT   LASTTRANSITIONTIME
account   Succeeded   0        2021-07-27T03:27:18Z
account   Progressing   0        2021-07-27T05:14:48Z
account   Progressing   20       2021-07-27T05:15:49Z
account   Progressing   40       2021-07-27T05:16:18Z
account   Progressing   60       2021-07-27T05:16:48Z
account   Progressing   80       2021-07-27T05:17:18Z
account   Promoting     0        2021-07-27T05:17:48Z
account   Finalising    0        2021-07-27T05:18:18Z
account   Succeeded     0        2021-07-27T05:18:48Z
```

- **Success Process 의 canary status 예시**

```yaml
status:
  canaryWeight: 0
  conditions:
  - lastTransitionTime: "2021-07-27T03:27:18Z"
    lastUpdateTime: "2021-07-27T03:27:18Z"
    message: Canary analysis completed successfully, promotion finished.
    reason: Succeeded
    status: "True"
    type: Promoted
  failedChecks: 1
  iterations: 0
  lastAppliedSpec: 6c67dd598f
  lastTransitionTime: "2021-07-27T03:27:18Z"
  phase: Succeeded
  trackedConfigs:
    configmap/account: f537fc97adad7769
    configmap/xray-sampling-rules: b6fc9ea0629f67d0
```

### analysis

release version 을 배포하여 해당 application 의 promotion 관련 설정을, analysis 를 통해 정의한다. 배포 전략이 여기서 정의된다.


> The canary analysis defines:
>> - the type of deployment strategy
>> - the metrics used to validate the canary version
>> - the webhooks used for conformance testing, load testing and manual gating
>> - the alerting settings


```yaml
  analysis:
    # schedule interval (default 60s)
    interval:
    # max number of failed metric checks before rollback
    threshold:
    # max traffic percentage routed to canary
    # percentage (0-100)
    maxWeight:
    # canary increment step
    # percentage (0-100)
    stepWeight:
    # promotion increment step
    # percentage (0-100)
    stepWeightPromotion:
    # total number of iterations
    # used for A/B Testing and Blue/Green
    iterations:
    # canary match conditions
    # used for A/B Testing
    match:
      - # HTTP header
    # key performance indicators
    metrics:
      - # metric check
    # alerting
    alerts:
      - # alert provider
    # external checks
    webhooks:
      - # hook
```


## Deployment Strategy

Flagger 의 canary analysis 정의를 통하여, 다양한 방식의 배포 전략을 고려할 수 있다.
Service Mesh 상에 설치된 Flagger 에 의해서, Canary Release, Blue/Green Deployment 가 실행되는 경우에 대한 좀 더 상세한 정리 내역이다.

Canary Analysis 작업은 아래 object 의 변경 event 에 의해 trigger 됨.
- Deployment PodSpec (container image, command, ports, env, resources, etc) 변경, 혹은 rollout restart
- Volume 으로 mount 되었거나, 환경 변수로 mapping 된 ConfigMap 변경
- Volume 으로 mount 된 Secret 변경

### Canary Release

Flagger 는 http request success rate, duration 등을 측정하면서, traffic 을 canary object 로 점진적으로 이동시킨다.
정의된 maximum traffic weight 에 도달하거나, check 실패 count 가 threshold 에 도달할 때까지, 주기적으로 traffic 을 이동시키고, 해당 release 의 promotion 이 가능한지 판단한다.

HTTP header, cookie 등을 활용하여, A/B Testing 을 통한 release 도 가능. (지원 가능한 service mesh, ingress controller 범위 내에서,,)

- **Flagger 의 Canary Release 진행 단계 예시 (Max Weight: 50)**
<img src="https://raw.githubusercontent.com/fluxcd/flagger/main/docs/diagrams/flagger-canary-steps.png" />

- **Canary promotion stage 예시**

  1. Canary deployment scan 및 새로운 Revision 감지
  2. Primary, Canary deployment status 확인
  : Rolling Update 진행 중인 경우, release 중단
  : Pod 상태가 비정상적일 경우, release 중단
  `[confirm-rollout webhook]`
  `[pre-rollout webhook]`
  3. 정의된 stepWeight 에 따른 Canary traffic 증가 (maxWeight 에 도달할 때까지, 정의된 interval 에 따라,,)
  `[rollout webhook]`
  4. (Optional) Webhook 에 정의된 Canary HTTP Request 실행 및 결과 확인
  : HTTP request success rate / duration 등을 확인하여, metric 에 지정된 임계값 미만인 경우, release 중단
  : rollout webhook 을 활용할 경우, weight 가 증가할 때 마다, webhook call API 를 통하여 canary 상태 check 가능
  `[confirm-promotion webhook]`
  5. Promote canary to primary
  : ConfigMap, Secret 을 primary 로 복사
  : Deployment spec template 을 primary 로 복사
  6. Primary Deployment rolling update
  : Pod 상태가 비정상적일 경우, rolling update 중단
  7. 모든 Traffic 을 primary 로 routing
  8. Canary Release scale 을 0 으로 확장
  9. Rollout 상태 종료
  `[post-rollout webhook]`
  10. (Optional) AlertProvider 에 의해Canary analysis 결과 alert 을 전송

<br/>

- **추가 확인 내역**  
1. <u>*skipAnalysis=true*</u> 로 정의할 경우, canary analysis 가 수행되지 않으며, canary release version 을 곧바로 promotion 한다. configmap, secret 변경 등을 감지하여 deployment 를 자동으로 restart 할 수 있는 용도로도 활용 가능할 것으로 보임.
2. configmap, secretmap 을 copy 하여 관리하는 기능은, flagger 설치 시 disable 가능.


### Blue/Green Deployment

stepWeight/maxWeight 의 정의를 interation 으로 대체하여, Blue/Green 배포 전략을 쉽게 달성할 수 있다.
Service Mesh 환경이 아닐 경우에는, Flagger 에서 Kubernetes 기본 L4 Networking 을 통하여, Blue/Green 배포를 할 수 있도록 지원한다.

- **Flagger Blue/Green Deployment 단계 예시**
<img src="https://raw.githubusercontent.com/fluxcd/flagger/main/docs/diagrams/flagger-bluegreen-steps.png" />

- **Blue/Green analysis 정의 예시**
: 아래 처럼 구성할 경우, 10분 동안 canary pod 의 적합성 및 부하 테스트를 webhook 호출에 의해서 자동으로 실행하거나, 혹은 수동으로 테스트를 진행할 수 있다. Canary Release 와 동일하게 metric 정의에서 실패한 경우 실패 counter 가 증가하여, threshold 기준에 도달할 경우 release 가 중단된다.

```yaml
  analysis:
    # schedule interval (default 60s)
    interval: 1m
    # total number of iterations
    iterations: 10
    # max number of failed iterations before rollback
    threshold: 2
```

<br/>

- **Blue/Green rollout stage 예시**

  1. Canary deployment scan 및 새로운 Revision 감지
  2. Canary Deployment scale up (Green)
  3. Canary Pod 에 대한 테스트 수행
  : 실패 임계 값에 도달하면 release 중단
  4. Canary 로 모든 traffic routing
  5. Canary spec 을 primary 로 복사 및 promote (Blue)
  6. Primary rollout
  7. Canary scale down

<u>_모든 analysis 작업이 완료되고, traffic 을 canary (Green) 환경으로 traffic routing 처리를 한 후에, primary 를 rollout 하므로, request 가 유실되는 것을 방지할 수 있다._</u>

