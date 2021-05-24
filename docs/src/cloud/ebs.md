# Amazon EBS

- Amazon Elastic Block Store(Amazon EBS)는 EC2 인스턴스에 사용할 수 있는 블록 수준 스토리지 볼륨을 제공
- Amazon EKS에서 Container Volume으로 활용
<https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/AmazonEBS.html>

## Deploy EBS CSI Driver
- EBS Container Storage Interface
- Amazon EBS Volume의 수명 주기 관리를 허용하도록 하는 Interface
- Persistent Volume 에 Amazon EBS 를 활용하기 위하여 배포

- CSI Driver Deploy Manual
<https://docs.aws.amazon.com/ko_kr/eks/latest/userguide/ebs-csi.html>
| <small>NOTE : *oidc key 입력 시, domain region 설정 주의.*</small>
---

- 배포 내역
```
$ kubectl get deploy -n kube-system | grep ebs
ebs-csi-controller             2/2     2            2           18d

$ kubectl get daemonset -n kube-system | grep ebs
ebs-csi-node   2         2         2       2            2           kubernetes.io/os=linux                            18d

$ kubectl get po -n kube-system | grep ebs
ebs-csi-controller-6cbd957db7-6d4x6             4/4     Running   0          33m
ebs-csi-controller-6cbd957db7-hzl96             4/4     Running   0          5d21h
ebs-csi-node-bdmts                              3/3     Running   0          2d5h
ebs-csi-node-gd9zz                              3/3     Running   0          8d
```

- EBS CSI Driver Github Repository 참조  
<https://github.com/kubernetes-sigs/aws-ebs-csi-driver>

## Create Volume on Container

- StorageClass YAML 설정 및 생성
  - EBS는 WaitForFirstConsumer 바인딩 모드를 지원
  - PersistentVolumeClaim 를 사용하는 Pod 생성 시점까지, Volume 바인딩과 프로비저닝을 지연
  <https://kubernetes.io/ko/docs/concepts/storage/storage-classes/#%EB%B3%BC%EB%A5%A8-%EB%B0%94%EC%9D%B8%EB%94%A9-%EB%AA%A8%EB%93%9C>

```yml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: <sc name>
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
```

- PersistentVolumeClaim YAML 설정 및 생성
  - accessMode는 ReadWriteOnce로 지정
  : 일반적인 용도의 EBS Volume은 여러 Instance에 Multi Attach가 불가능
  <https://kubernetes.io/ko/docs/concepts/storage/persistent-volumes/#%EC%A0%91%EA%B7%BC-%EB%AA%A8%EB%93%9C>

```yml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  namespace: <namespace name>
  name: <pvc name>
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: <sc name>
  resources:
    requests:
      storage: <request size>
```

- pvc 사용하는 pod 최초 생성시, PersistentVolume Bound
```
$ kubectl get pvc -n session-dev | grep redis
redis-cache           Bound    pvc-c7ac4781-948d-4f9e-8050-f72406b25753   4Gi        RWO            ebs-sc         18d
redis-session         Bound    pvc-0f1bfdee-e631-4368-83e6-f9d47435dbcb   4Gi        RWO            ebs-sc         18d

$ kubectl get pv -n session-dev | grep redis
pvc-0f1bfdee-e631-4368-83e6-f9d47435dbcb   4Gi        RWO            Delete           Bound    session-dev/redis-session            ebs-sc                  18d
pvc-c7ac4781-948d-4f9e-8050-f72406b25753   4Gi        RWO            Delete           Bound    session-dev/redis-cache              ebs-sc                  18d
```

- EKS Cluster에 pvc / pv 생성 후, EBS Volume 자동 생성
  - AWS Console에서 EBS Volume 확인
![](../../images/ebs-console-view.png)
