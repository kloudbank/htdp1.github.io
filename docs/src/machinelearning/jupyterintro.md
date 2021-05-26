# Basics

- Issue
  - 기존 Jupyter Notebook 방식은 GPU Resource 를 단독으로 점유하여, Utilization 이 낮음
  - Jupyter Server 를 활용하여, python 개발 환경과 Resource 관리 환경을 분리
  - Jupyter Hub 를 활용하여, 개발 환경 통합 및 Idel Culling 을 통한 Resource 관리

- Jupyter Server
  - Jupyter Notebook 및 Client API 를 제공하는 Backend Service 로 Jupyter Server 활용
  - VS Code Extension / StandAlone Frontend App. 에서 Remote Jupyter Server 에 연결  

- Jupyter Hub
  - Jupyter Notebook Official Image 연계 Python 개발 환경
  - Jupyter Notebook Custom Image 연계
  - Migration to Jupyter Hub
  - Jupyter Lab 호환성
  - Idle Culler
  - Authentication Test

- Jupyter Server Proxy
  - proxy with jupyter hub
  - Code Server jupyter server proxy config
  - jupyter-r-session-proxy
  - kaggle notebook server proxy config


- 작업 내역
> htdp1/jupyter-k8s repository
<https://github.com/htdp1/jupyter-k8s>

<Comment />


