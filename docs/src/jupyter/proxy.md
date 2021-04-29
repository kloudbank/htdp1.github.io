# Jupyter Server Proxy

Jupyter Server Proxy를 사용하여, Notebook 과 함께 임의의 외부 프로세스 (ex> RStudio, VS Code etc.) 를 실행하고, 이에 대한 인증을 Notebook Server 가 대신 처리하여 Access 를 제어할 수 있다.  

Notebook / Lab 환경에 jupyter-server-proxy extension 을 설치를 통하여 proxy 활성화 가능하며, 각 extension 에서 proxy url 과 mapping 된 버튼을 선택하여 browser 를 통해 access 할 수 있다.

- Jupyter Notebook Extension 에서 실행
<img src="https://jupyter-server-proxy.readthedocs.io/en/latest/_images/nbextension-tree.png" title="nbex-tree"></img>
- Jupyter Hub Extension 에서 실행
<img src="https://jupyter-server-proxy.readthedocs.io/en/latest/_images/labextension-launcher.png" title="nbex-tree"></img>

> Jupyter Server Proxy Docs 참조
<https://jupyter-server-proxy.readthedocs.io/en/latest/index.html>

> Running nonjupyter applications on JupyterHub with jupyter-server-proxy| JupyterCon 2020
<https://www.youtube.com/watch?v=8tFLZWT0u2Y>


## With Jupyter Hub

JupyterHub를 사용하고 있고 해당 서버에서 port 8080 를 listening 하는 process 가 있다고 가정 할 때, Jupyter Hub URL 을 사용하여 port 8080 에서 실행되는 서비스에 access 가능. (ex> myhub.org/hub/{user-redirect}/proxy/8080)

Hub 에 login 되어 있는 특정 사용자에게 올바른 URL로 redirection 이 제공되고, default_url 설정을 통해서 proxy URL 에 default access 도 가능. Hub 에 login 되지 않은 사용자가 로그인하지 않은 경우, login 인증 완료 한 후 redirection.

- Architecture

@startuml
skinparam component {
}
"Client" as client
node "EKS" as eks {
  rectangle "Jupyter Hub" as jhub {
    (AuthClass) as hubauth
  }
  rectangle "Jupyter Notebook" as notebook {
    (Jupyter Server Proxy) as proxy
    (WebApp:p8080) as webapp
  }
}
top to bottom direction
client -> jhub: /hub/proxy/8080
hubauth -down-> proxy: Redirect to {user-redirect}
proxy <.down.> webapp #line:blue;line.dashed;text:blue : req / res
@enduml


## Code Server by Jupyter Proxy

Jupyter Server Proxy 를 활용한 Code Server 실행

### Jupyter + Code Server

- Jupyter + Code Server Docker Image
<https://github.com/htdp1/jupyter-k8s/blob/main/dev/jupyter-notebook/code-server/Dockerfile>
- Notebook Config Customize
<https://github.com/htdp1/jupyter-k8s/blob/main/dev/jupyter-notebook/code-server/.jupyter/jupyter_notebook_config.py>

### Migration with Jupyter Server Proxy

- Code Server Docker Commit Image + Jupyter
<https://github.com/htdp1/jupyter-k8s/tree/main/dev/jupyter-notebook/code-server/mig>


## R Studio by Jupyter Proxy

Jupyter RSession Proxy 를 활용한 R Studio 실행

### Jupyter + R Studio

- Jupyter + R Studio Docker Image
<https://github.com/htdp1/jupyter-k8s/blob/main/dev/jupyter-notebook/rstudio/Dockerfile>

> jupyter-rsession-proxy github 
<https://github.com/jupyterhub/jupyter-rsession-proxy>

### Migration with Jupyter Server Proxy
TBD

