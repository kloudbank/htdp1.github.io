# Amazon ALB

## Application Load Balancer

- AWS opensource blog
> <https://aws.amazon.com/ko/blogs/opensource/kubernetes-ingress-aws-alb-ingress-controller/>

<img src="https://d2908q01vomqb2.cloudfront.net/ca3512f4dfa95a03169c5a670a4c91a19b3077b4/2018/11/20/image1-1.png" width="800px" height="550px" title="px(픽셀) 크기 설정" alt="alb"></img><br/>

### Ingress 생성
#### 위 다이어그램에서 번호가 매겨진 파란색 원의 단계를 따릅니다.

1. 컨트롤러는 API 서버의 Ingress 이벤트를 감시합니다. 요구 사항을 충족하는 Ingress 리소스를 찾으면 AWS 리소스 생성을 시작합니다.
2. Ingress 리소스에 대한 ALB가 생성됩니다.
3. Ingress 리소스에 지정된 각 백엔드에 대해 TargetGroup 이 생성됩니다.
4. 수신 리소스 주석으로 지정된 모든 포트에 대해 리스너가 생성됩니다. 포트를 지정하지 않으면 적절한 기본값 (80또는 443)이 사용됩니다.
5. Ingress 리소스에 지정된 각 경로에 대해 규칙이 생성됩니다. 이렇게 하면 특정 경로에 대한 트래픽이 TargetGroup 생성된 올바른 경로로 라우팅 됩니다.


## Deploy ALB Controller
- AWS Load Balancer Controller는 EKS Cluster에 대한 AWS Elastic Load Balancer를 관리함
<https://docs.aws.amazon.com/ko_kr/eks/latest/userguide/aws-load-balancer-controller.html>
- Ingress가 L7에서 Balancing 되는 Application Load Balancer로 생성됨
<https://docs.aws.amazon.com/ko_kr/eks/latest/userguide/alb-ingress.html>

- Kubernetes manifest 활용하여 생성 (helm 아님)
  - v2_1_0_full.yaml 참조  
  <https://github.com/htdp1/md-repository/blob/main/create-alb/v2_1_0_full.yaml>

    - ServiceAccount Section 삭제
    - Deployment 섹션에서 spec 값을 --cluster-name 을 Amazon EKS Cluster name 으로 수정

- 배포 내역
```
$ kubectl get deploy -n kube-system | grep load-balancer
aws-load-balancer-controller   1/1     1            1           27d

 $ kubectl get po -n kube-system | grep load-balancer
aws-load-balancer-controller-67b465c774-lwc22   1/1     Running   0          42m
```

## Create Ingress on EKS Cluster
- Ingress YAML 설정 및 생성
  - kubernetes.io/ingress.class
  : alb / nlb / clb 등으로 설정 가능하며, L7 Application ELB 로 생성하기 위하여 alb로 설정
  - alb.ingress.kubernetes.io/subnets
  - alb.ingress.kubernetes.io/security-groups
  : load balancer가 생성될 subnet, security group 등을 지정
  : eks cluster가 배포되는 모든 subnet 을 지정해주어야 함
  - alb.ingress.kubernetes.io/group.name
  : 각 ingress에 동일한 group name을 지정하여, 동일한 Load Balancer로 트래픽을 처리하도록 지정 가능

```yml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: <app name>
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    # 설정 필요
    alb.ingress.kubernetes.io/subnets: <subnet-id-01>, <subnet-id-02>
    alb.ingress.kubernetes.io/security-groups: <security group id>
    alb.ingress.kubernetes.io/group.name: <group name>
spec:
  rules:
  - http:
      paths:
      - path: /*
        backend:
          serviceName: <app name>
          servicePort: <port>
```

- EKS Cluster에 Ingress 생성 후, ALB Controller 에 의해 Application Load Balancer 자동 생성
  - AWS Console에서 Elastic Load Balancer 확인
![](../../images/alb-console-view.png)
