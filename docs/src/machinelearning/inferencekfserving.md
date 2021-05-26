# KFServing

## Introduction

KFServing 은 Machine Learning Model Serving 을 위한 Kubernetes CRD 를 제공한다. Tensorflow, XGBoost, ScikitLearn, PyTorch, ONNX 와 같은 일반적인 M/L Framework 을 위한 고성능의 높은 추상화 인터페이스를 제공하여, production Model 을 Serving 한다.

- Features (<https://github.com/kubeflow/kfserving/blob/master/docs/samples/README.md>)
  - Scale to and from Zero
  - Request based Autoscaling on CPU/GPU
  - Revision Management
  - Optimized Container
  - Batching
  - Request/Response logging
  - Scalable Multi Model Serving
  - Traffic management
  - Security with AuthN/AuthZ
  - Distributed Tracing
  - Out-of-the-box metrics
  - Ingress/Egress control

***
| <small>위와 같은 다양한 serverless feature 가 제공되는 이유는 kubernetes cluster 내에 이미 배포되어 있는 Istio, Knative 등에서 제공하는 custom resrouce 를 활용하기 때문이다.</small>
<small>또한, KFServing 이 embedded 된 형태로 제공되는 <b>Kubeflow</b> 를 Kubernetes 에 배포하여, 완전 관리형의 MLOps Framework 의 형태로 활용할 수도 있다.</small>
***

<img src="https://github.com/kubeflow/kfserving/raw/master/docs/diagrams/kfserving.png" title="kfserving" alt="kfserving"></img>

> KFServig Github Repository 참조
<https://github.com/kubeflow/kfserving>
> KFServing v1beta1 RFC 참조
<https://docs.google.com/document/d/1ktiO7gWohq19C_rixXH0T_D91TjkrQELlQjlkvSefVc/edit#heading=h.e1sgar1o8xoy>


## Architecture

- Architecture Overview  
  - Data Plane
  : Traffic 의 전송 목적, single model 에 대한 traffic 전송 예시
  - Control Plane
  : Data Plane 까지의 Traffic 을 제어하는 영역

> KFServing Architecture Overview
<https://github.com/kubeflow/kfserving/blob/master/docs/README.md>
> MLOps Community KFServing Slideshare 참조
<https://www.slideshare.net/theofpa/serving-models-using-kfserving>


### Data Plane

Predictor Container 를 활용하여, inference server 를 구성하여 기본적인 model serving 이 가능하며, Explainer / Transformer 는 optional 한 component 이다.

- Single model 에 대한 request 처리 예시  

<img src="https://github.com/kubeflow/kfserving/raw/master/docs/diagrams/dataplane.jpg" ></img>

- Concepts
  - Endpoint : InferenceServer는 "default"과 "canary"의 두 endpoint 로 나뉨. canary 는 optional 이며 InferenceService 의 상세 설정을 통해 rollout 전략을 변경할 수 있음. 기본적으로는 default endpoint 에서 처리함.

  - <b>Predictor : InferenceService의 필수 구성 요소. Network endpoint 에서 사용할 수 있도록 하는 단순한 model 이자 model server.</b>

  - <small>Explainer : Explainer 는 prediction 외에도 model explanation 을 제공하는 optional 한 Data Plane 활성화 가능. 자체적으로 정의하는 Container 로 구성 가능. 일반적으로 KFServing은 Alibi 와 같은 out-of-the-box Explainer 를 제공.</small>

  - <small>Transformer : Transformer 를 사용하여, 사용자가 prediction / explanation workflow 의 사전/사후 처리 가능. 자체적으로 정의하는 Container 로 구성 가능. 일반적으로 KFServing은 Feast 와 같은 out-of-the-box Transformer 를 제공.</small>

- Data Plane API (v2)
  - v1 API 가 v2 로 통합되는 과정에 있으며, v1 에서는 위 그림처럼 explain/predict 의 API 를 따로 제공하였으나, v2 에서는 predict 로 통합되는 것으로 보임.
  - HTTP/REST, GRPC 지원

> v2 api docs 참조
<https://github.com/kubeflow/kfserving/tree/master/docs/predict-api/v2>


### Control Plane

Kubernetes custom resource 로 정의한, InferenceService, TrainedModel 을 통하여, predictor, explainer, transformer 등의 container 를 배포하며, workload 에 들어오는 요청에 따라서 autoscaling 등을 수행한다.

<img src="https://github.com/kubeflow/kfserving/raw/master/docs/diagrams/kfs_architect.png" ></img>

- Control Plane Component
  - Knative Serving Controller: Service revision 관리, Network routing resource 생성 등을 수행. 기본적으로 Queue Proxy 라는 sidecar 가 함께 생성되며, traffic metric expose, 동시성 제한 등을 수행.
  - Knative Activator : 0으로 축소 된 포드를 다시 가져오고 요청을 전달합니다.
  - Knative Autoscaler (KPA) : 애플리케이션에 대한 트래픽 흐름을 감시하고 구성된 메트릭에 따라 복제본을 확장 또는 축소합니다.
  - KFServing Controller : 요청 / 응답 로깅, 일괄 처리 및 모델 풀링을위한 서비스, 수신 리소스, 모델 서버 컨테이너 및 모델 에이전트 컨테이너 생성을 담당합니다.
  - Ingress Gateway : 외부 또는 내부 요청을 라우팅하기위한 게이트웨이입니다.

