# Quick Start

AWS에 생성한 Resource 및 필요한 초기 설정 정리한 내역임

## AWS Configure

### Prerequisite
- aws-cli 설치
- AWS Access Key 생성
- 기본 Region은 Seoul (ap-northeast-2)

```
aws configure --profile <username>
AWS Access Key ID [None]: <user key id>
AWS Secret Access Key [None]: <user access key>
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

## Create kubeconfig
- kubeconfig 생성 후, kube-system aws-auth configmap에 mapUser 추가 필요

```
aws eks update-kubeconfig \
  --region ap-northeast-2 \
  --name <cluster name> \
  --profile <username>
```


## Troubleshooting

### Docker Image Cache 관리
- 지정된 디스크 사용량 비율로 Image Cache 정리하도록 구성하는 Guide
<https://aws.amazon.com/ko/premiumsupport/knowledge-center/eks-worker-nodes-image-cache/>

### Docker GC

```sh
docker run --rm --privileged -v /var/run/docker.sock:/var/run/docker.sock -v /etc:/etc:ro spotify/docker-gc
```
<https://github.com/spotify/docker-gc>

### Evicted Pod 삭제
```sh
kubectl get po -A | grep Evicted | awk '{print $1" " $2}' | xargs kubectl delete po -n {namespace}
```

