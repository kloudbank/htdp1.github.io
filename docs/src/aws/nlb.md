# Amazon NLB

## Network Load Balancer

- AWS opensource blog
> <https://aws.amazon.com/ko/blogs/opensource/network-load-balancer-nginx-ingress-controller-eks/>

<img src="https://quip-amazon.com/blob/bGA9AAmviCK/RxIsFh8j-vQYBvmZWBNpOw?a=gc7lDKxZ4JUQcZcn1Ojr4h0axnP0cmkLy1LWdZ3fuDga" width="550px" height="580px" title="px(픽셀) 크기 설정" alt="nlb"></img><br/>

### NGINX Ingress Controller
#### ALB Ingress Controller 대신, NGINX Ingress Controller 기반의 Amazon NLB 사용

- 기본적으로 NGINX Ingress Controller 는 모든 namespace 의 모든 수신 이벤트를 수신하고 해당 지시문과 규칙을 NGINX 구성 파일에 추가합니다. 이를 통해 모든 수신 규칙, 호스트 및 경로를 포함하는 중앙 집중식 라우팅을 사용할 수 있습니다.

- NGINX Ingress Controller 를 사용하면 동일한 Network Load Balancer 를 사용하는 여러 환경 또는 namespace 에 대한 여러 수신 객체를 가질 수도 있습니다. ALB를 사용하는 경우 각 수신 개체에는 새로운 로드 밸런서가 필요합니다.
또한, NGINX 인 그레스 컨트롤러와 함께 사용할 경우 경로 기반 라우팅과 같은 기능을 NLB에 추가 할 수 있습니다.


## Deploy NGINX Ingress Controller

- 아래 manifest 를 deploy 시, EKS Cluster 에 NGINX Ingress Controller 를 설치 및 Amazon NLB 가 실행됨

```
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-0.32.0/deploy/static/provider/aws/deploy.yaml
```

- 배포 내역

```
$ kubectl get svc -n ingress-nginx
NAME                                 TYPE           CLUSTER-IP      EXTERNAL-IP       PORT(S)                      AGE
ingress-nginx-controller             LoadBalancer   10.100.86.111   <external ip>   80:30840/TCP,443:30757/TCP   2d17h

$ kubectl get po -n ingress-nginx
NAME                                       READY   STATUS    RESTARTS   AGE
ingress-nginx-controller-98f46f89d-7c74g   1/1     Running   0          2d
```

## Create Ingress on EKS Cluster
- Ingress YAML 설정 및 생성
  - kubernetes.io/ingress.class
  : nginx ingress controller 의 class 인 nginx 로 설정
- ALB 사용 시 설정했던, subnet / security group 지정 필요 없음

```yml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: <app name>
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "false"
spec:
  rules:
  - host: <host name>
    http:
      paths:
      - path: <path name>
        backend:
          serviceName: <app name>
          servicePort: <port>
```

- (Optional) Hosted Zone 설정
  - AWS Console에서 Route 53 Hosted Zone 에서, Domain 이 Amazon NLB 를 가리키도록 설정 가능
  <https://console.aws.amazon.com/route53/v2/hostedzones#>
