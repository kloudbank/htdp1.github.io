# Jupyter Server

Jupyter Server 는 Jupyter Notebook, JupyterLab 및 Voilà 와 같은 Jupyter Web Application 을 위한 Backend (core, API, REST endpoint) 를 제공한다.

> Jupyter Server Docs 참조
<https://jupyter-server.readthedocs.io/en/latest/index.html>
> Jupyter Github 참조
<https://github.com/jupyter-server/jupyter_server>

- Jupyter Notebook Migration
  - Jupyter Notebook 과 Server 는 동일한 API 를 제공하고, configuration 내역도 거의 유사하여 Notebook 과 Server 간 1:1 Migration 에는 큰 어려움이 없을 것으로 보임.
  - Jupyter Server 로 Migration 후, NB Classic Extension 을 활용하여, 각 Server 에 대한 Notebook 제공 가능.
  | <u>*다만, Notebook Frontend 만 분리하여 서비스할 수 있도록 제공되지는 않으며, 현재는 Jupyter Lab 을 사용하는 것을 권고하고 있음*</u>
> NB Classic 및 Jupyter 향후 계획 참조
<https://jupyter-server.readthedocs.io/en/latest/operators/migrate-from-nbserver.html#running-jupyter-notebook-on-jupyter-server>

## Base Image

- 구성 내역
  - Jupyter Server 의 경우, Official Docker Image 는 제공되지 않음.
  - conda 를 활용하여 jupyter server package install.
  - miniconda 환경에서 multi environment 를 생성하여, 기본적으로 python2 / python3 ipython kernel 을 활용할 수 있도록, Dockerfile 작성.

- Dockerfile
```Docker
FROM continuumio/miniconda3

# Install jupyter server
WORKDIR /app
RUN conda install -c conda-forge jupyter_server
RUN conda run jupyter server --generate-config --allow-root -y

# Make RUN commands use the new environment:
RUN conda create -n py38 python=3.8
SHELL ["conda", "run", "-n", "py38", "/bin/bash", "-c"]
RUN python3 -m pip install ipykernel
RUN python3 -m ipykernel install --user --name python3 --display-name "python3.8"

RUN conda create -n py27 python=2.7
SHELL ["conda", "run", "-n", "py27", "/bin/bash", "-c"]
RUN python2 -m pip install ipykernel
RUN python2 -m ipykernel install --user --name python2 --display-name "python2.7"

EXPOSE 8888

ENTRYPOINT ["conda", "run", "--no-capture-output", "jupyter", "server","--allow-root", "--ip=0.0.0.0"]
```

## Configuration
"jupyter server --generate-config" 를 통해서 생성된 config file 을 활용하여, k8s configmap 에 활용할 jupyter_server_config.py 작성.

> Jupyter Server Full Configuration 참조
<https://jupyter-server.readthedocs.io/en/latest/other/full-config.html#other-full-config>

- jupyter_server_config.py 주요 내역

```python
# Configuration file for jupyter-server.

...

## Full path of a config file.
#  Default: ''
c.JupyterApp.config_file = '<app_config_file_path>'

## Set the Access-Control-Allow-Origin header
#  
#  Use '*' to allow any origin to access your server.
#  
#  Takes precedence over allow_origin_pat.
#  Default: ''
c.ServerApp.allow_origin = '<allow_origin_host>'

## Whether to allow the user to run the server as root.
#  Default: False
c.ServerApp.allow_root = True

## Disable cross-site-request-forgery protection
#  
#  Jupyter notebook 4.3.1 introduces protection from cross-site request
#  forgeries, requiring API requests to either:
#  
#  - originate from pages served by this server (validated with XSRF cookie and
#  token), or - authenticate with a token
#  
#  Some anonymous compute resources still desire the ability to run code,
#  completely without authentication. These services can disable all
#  authentication and security checks, with the full knowledge of what that
#  implies.
#  Default: False
c.ServerApp.disable_check_xsrf = True

## The IP address the Jupyter server will listen on.
#  Default: 'localhost'
c.ServerApp.ip = '<ip_address>'

## DEPRECATED, use root_dir.
#  Default: ''
c.ServerApp.notebook_dir = '<notebook_dir>'

## Hashed password to use for web authentication.
#  
#  To generate, type in a python/IPython shell:
#  
#    from jupyter_server.auth import passwd; passwd()
#  
#  The string should be of the form type:salt:hashed-password.
#  Default: ''
c.ServerApp.password = '<type:salt:hashed-password>'

## Forces users to use a password for the Jupyter server. This is useful in a
#  multi user environment, for instance when everybody in the LAN can access each
#  other's machine through ssh.
#  
#  In such a case, serving on localhost is not secure since any user can connect
#  to the Jupyter server via ssh.
#  Default: False
c.ServerApp.password_required = True

## The port the Jupyter server will listen on.
#  Default: 8888
c.ServerApp.port = <port_number>

## Token used for authenticating first-time connections to the server.
#  
#  When no password is enabled, the default is to generate a new, random token.
#  
#  Setting to an empty string disables authentication altogether, which is NOT
#  RECOMMENDED.
#  Default: '<generated>'
c.ServerApp.token = '<generated>'

...

```

## Kubernetes Deploy
k8s service 를 통해서 cluster 내 다른 서비스를 통해 접속하거나, ingress 를 통해서 외부에서도 접속하도록 설정 가능

- deployment 주요 내역

```yaml
...

    spec:
      containers:
      - image: htdp1/jupyter-server:latest
        name: jupyter-server
        imagePullPolicy: Always
        ports:
        - containerPort: 8888
        # Entrypoint command
        command: ["conda", "run", "--no-capture-output", "jupyter", "server", "--config=/opt/jupyter_server/.jupyter/jupyter_server_config.py"]
... 
        volumeMounts:
        - name: persistent-storage
          mountPath: /opt
        # Config mount
        - name: config
          mountPath: /opt/jupyter_server/.jupyter
      volumes:
      - name: persistent-storage
        persistentVolumeClaim:
          claimName: jupyter-server
      # Cusomized config: jupyter_server_config.py
      - name: config
        configMap:
          name: jupyter-server
          items:
          - key: jupyter_server_config.py
            path: jupyter_server_config.py
...
```
