# Introduction

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
