# Multi Cluster 구축
- 구축 목표
    - Control Plane 과 Data Planes 으로 구성한다.
    - Cluster 에 설치되는 기본 컴포넌트의 설치를 자동화 한다.
    - Cluster EndPoint 관리를 자동화 한다.
    - DWP 에서 Cluster Resource 제어시 Task Runner 를 적용한다.
    - DWP 에서 Cluster Resource 제어시 async, non-block 을 적용한다.
    - DWP 에서 Cluster Resource 제어시 status monitoring 을 적용한다.
    - Access Log 를 Application 외부에서 처리한다.

## Deployment Diagram
### Site A
- Site B 에서 사용하는 컴포넌트만 표시함

@startuml

title "Site A"

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

rectangle "Common Service" as a_comm {
    [SSO] as a_comm_sso
    [Cube] as a_comm_cube
    [CDN] as a_comm_cnd
    [SMTP] as a_comm_smtp
    a_comm_sso -[hidden]r- a_comm_cube
    a_comm_cube -[hidden]r- a_comm_cnd
    a_comm_cnd -[hidden]r- a_comm_smtp
}
rectangle "CI/CD" as hcp_cicd {
    [Nexus] as hcp_cicd_nexus
    [Bitbucket] as hcp_cicd_bitbucket
    [Jira] as hcp_cicd_jira
    [Harbor] as hcp_cicd_harbor #orange
    hcp_cicd_bitbucket -[hidden]r- hcp_cicd_harbor
    hcp_cicd_bitbucket -[hidden]r- hcp_cicd_jira
}
node "Platfrom Plane" as hcp {
    rectangle "Portal" as hcp_portal {
        [WP] as hcp_portal_wp
        [DWP] as hcp_portal_dwp
        [Redis-WP] as hcp_portal_rediswp
        [Redis-DWP] as hcp_portal_redisdwp
        hcp_portal_wp -d-* hcp_portal_rediswp
        hcp_portal_dwp -d-* hcp_portal_redisdwp
    }
    rectangle "Agent Service" as hcp_agent {
        [TaskAgent] as hcp_agent_taskagent #orange
        [NotifyAgent] as hcp_agent_notifyagent #orange
    }
}
a_comm -[hidden]d- hcp_cicd
hcp_cicd -[hidden]d- hcp

@enduml

### Site B
- Control Plane, Data Plane 으로 구분
- Platform Plane 과의 통신을 TaskAgent 와 TaskRunner 를 이용하는 방안

@startuml

title "Site B"

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

node "Control Plane" as bcp {
    rectangle "Task Service" as bcp_cicd {
        [TaskRunner] as bcp_taskruuner #orange
        [ArgoCD] as bcp_argocd #orange
        bcp_taskruuner -[hidden]r- bcp_argocd
    }
    rectangle "CI/CD Service" as bcp_common {
        [Gitee] as gitee #orange
        [Nexus] as nexus
        [SonarQube] as sonarqube
        [Harbor] as harbor #orange
        nexus -[hidden]r- sonarqube
        sonarqube -[hidden]r- harbor
        harbor -[hidden]r- gitee
    }
    rectangle "Monitoring/Alert" as bcp_mon {
        [Elastic-Search\n(long-terms)] as bcp_mon_elk
        [Grafana\n(long-terms)] as bcp_mon_grafana
        [Kibana\n(long-terms)] as bcp_mon_kibana
        [Prometheus\n(long-terms)] as bcp_mon_prometheus
        bcp_mon_elk -[hidden]r- bcp_mon_grafana
    }
    rectangle "Managed Service" as bcp_managed {
        [Redis] as bcp_mananged_redis
    }
    bcp_cicd -[hidden]d- bcp_common
    bcp_cicd -[hidden]d- bcp_managed
    bcp_common -[hidden]d- bcp_mon
}

@enduml

@startuml

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

node "Data Plane" as bdp {
    rectangle "Task Service" as bdp_task {
        [ArgoCD] as bdp_argocd #orange
    }
    rectangle "Biz" as bdp_biz {
        [A-Biz-App.-Backend] as bdp_biza
        [B-Biz-App.-Backend] as bdp_bizb
    }
    rectangle "Monitoring/Alert" as bdp_mon {
        [Elastic-Search\n(short-terms)] as bdp_mon_elk
        [Grafana\n(short-terms)] as bdp_mon_grafana
        [Kibana\n(short-terms)] as bdp_mon_kibana
        [Prometheus\n(short-terms)] as bdp_mon_prometheus
        [loki\n(short-terms)] as dbp_mon_loki #orange
        bdp_mon_elk -[hidden]r- bdp_mon_grafana
        bdp_mon_grafana -[hidden]r- bdp_mon_kibana
        bdp_mon_kibana -[hidden]r- bdp_mon_prometheus
        bdp_mon_prometheus -[hidden]r- dbp_mon_loki
    }
    bdp_task -[hidden]d- bdp_mon
}
@enduml

## Create Cluster
- Cluster 를 새로 구축하는 경우 절차를 기술함
- Site Cluster 정보를 관리하는 TaskAgent 가 필요함
- Site Cluster 에 설치될 컴포넌트는 ArgoCD 로 관리함

### Platform Cluster 에 TaskAgent 를 설치
- TaskAgent 를 어떤걸 사용해야 할지 ?
- TaskRunner 에 대한 EndPoint 관리 필요
    - Discovery Control Plane TaskRunner ?

### Site Cluster 의 Control Plane 구성요소 설치
- Control Plane ArgoCD 를 설치한다.
- Cluster 구성
    - Control Plane 용 git repo 를 준비한다.
    - git repo 에 cluster 에 설치할 yaml 파일을 push 한다.
        - 1개 git repo 로도 가능할 수 있음
        - 컴포넌트의 특성에 따라 git repo 를 분할해도 됨
    - git repo 로 ArgoCD Application 을 구성한다.
        - 1개 Application 으로도 가능할 수 있음
        - 컴포넌트의 특성에 따라 Application 을 분할해도 됨
- TaskRunner 구성
    - Task 용 git repo 를 준비한다.
    - git repo 에 task yaml 파일을 push 한다.
    - git repo 로 ArgoCD Application 을 구성한다.
        - 1개 Application 으로도 가능할 수 있음
        - 컴포넌트의 특성에 따라 Application 을 분할해도 됨
- TaskAgent 에 Control Plane 정보를 기록한다.
    - TaskAgent restart 없이 적용 방안?

### Site Cluster 의 Data Plane 구성요소 설치
- Data Plane 에 ArgoCD 를 설치한다.
- Cluster 구성
    - Data Plane 용 git repo 를 준비한다.
    - git repo 에 cluster 에 설치할 yaml 파일을 push 한다.
        - 1개 git repo 로도 가능할 수 있음
        - 컴포넌트의 특성에 따라 git repo 를 분할해도 됨
    - git repo 로 ArgoCD Application 을 구성한다.
        - 1개 Application 으로도 가능할 수 있음
        - 컴포넌트의 특성에 따라 Application 을 분할해도 됨
    - Control Plane TaskRunner 에 Data Plane 정보를 기록한다.
        - TaskRunner restart 없이 적용 방안?
    - TaskAgent 에 Data Plane 정보를 기록한다.
        - TaskAgent restart 없이 적용 방안?

## Sequence Diagram
- 사용자 관점에서 필요한 프로세스를 Sequece Diagram 으로 작성

### Login SSO process
- 프로세스 설명
    - Site A 사용자가 A url 과 B url 을 사용하여 로그인 할 경우
        - case1, case2
    - Site B 사용자가 B url 을 사용하여 로그인 할 경우
        - case3

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Login Process"

box "site A"
actor "site A User" as a_user
participant SSO as a_sso
participant "A url WP" as a_wp
participant "B url WP" as b_wp
end box
box "site B"
participant SSO as b_sso
actor "site B User" as b_user
end box

autonumber 1-1
a_user -> a_wp : login
note left : case1
a_wp -> a_sso : authentication
a_sso -> a_wp : redirect url
a_wp -> a_user : success

autonumber 2-1
a_user -> b_wp : login
note left : case2
b_wp -> b_sso : authentication
b_sso -> b_wp : redirect url
b_wp -> a_user : success

autonumber 3-1
b_user -> b_wp : login
note right : case3
b_wp -> b_sso : authentication
b_sso -> b_wp : redirect url
b_wp -> b_user : success

@enduml

### Create application process
- 검토 필요 사항
    - Async process 에 대한 status 조회 방안 필요

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "App. 생성"

actor User
box "site A"
participant DWP
participant CUBE
participant NotifyAgent
participant TaskAgent
participant "Bitbucket\n(source)" as source
participant "Bitbucket\n(yaml)" as yaml
end box
box "site B - control plane"
participant TaskRunner
participant ArgoCD
participant Harbor
end box

autonumber 1-1
User -> DWP : create app.
DWP -\ TaskAgent : run task
TaskAgent -\ TaskRunner : run task
TaskAgent --\ NotifyAgent : send notify
NotifyAgent --\ CUBE : send message

autonumber 2-1
TaskRunner -> source : checkout source template
TaskRunner -> source : push source
TaskRunner -> yaml : checkout yaml template
TaskRunner -> yaml : push yaml
TaskRunner -> TaskRunner : create pipeline
TaskRunner -> ArgoCD : create app.(/w data plane)
TaskRunner -> Harbor : create docker repository
TaskRunner --> NotifyAgent : send notify
NotifyAgent --\ CUBE : send message

autonumber 2-1
User -> DWP : view status

@enduml

### CI process
- 검토 필요 사항
    - Async process 에 대한 status 조회 방안 필요

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "App. CI"

actor User
box "site A"
participant DWP
participant CUBE
participant NotifyAgent
participant TaskAgent
participant "Bitbucket\n(source)" as source
end box
box "site B"
participant TaskRunner
participant Nexus
participant Harbor
participant SonarQube
end box

autonumber 1-1
User -> DWP : run CI
note left : CI
DWP -\ TaskAgent : run task
TaskAgent -> TaskAgent : discovery taskrunner
TaskAgent -\ TaskRunner : run task
TaskAgent --\ NotifyAgent : send notify
NotifyAgent --\ CUBE : send message

autonumber 2-1
TaskRunner -> TaskRunner : run task
TaskRunner -> source : checkout source
TaskRunner -> Nexus : download libs
TaskRunner -> TaskRunner : app. build
TaskRunner -> TaskRunner : docker build
TaskRunner -> Harbor : push docker image
TaskRunner -> SonarQube : test source
TaskRunner --\ NotifyAgent : send notify
NotifyAgent --\ CUBE : send message

autonumber 2-1
User -> DWP : view status

@enduml

### CD process
- 검토 필요 사항
    - Async process 에 대한 status 조회 방안 필요

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "App. CD"

actor User
box "site A"
participant DWP
participant CUBE
participant NotifyAgent
participant TaskAgent
participant "Bitbucket\n(yaml)" as yaml
end box
box "site B - control plane"
participant TaskRunner
participant ArgoCD
participant Harbor
end box

box "site B - data plane"
participant k8s
end box

autonumber 1-1
User -> DWP : run CD
note left : CD
DWP -\ TaskAgent : run task
TaskAgent -> TaskAgent : discovery taskrunner
TaskAgent -\ TaskRunner : run task
TaskAgent --\ NotifyAgent : notify status
NotifyAgent --\ CUBE : send message

autonumber 2-1
TaskRunner -> yaml : checkout yaml
TaskRunner -> TaskRunner : modify yaml
TaskRunner -> yaml : push yaml
TaskRunner -\ ArgoCD : run deploy
TaskRunner --\ NotifyAgent : notify status
NotifyAgent --\ CUBE : send message

autonumber 3-1
ArgoCD -> yaml : chcekout yaml
note right : sync yaml
ArgoCD -\ k8s : deploy yaml
k8s -> Harbor : pull docker image

autonumber 4-1
User -> DWP : view status

@enduml


## ETC
### Tekton

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Tekton"

object git
object image
object Pipeline
object PipelineRun
object PipelineResource
object Task
object TaskRun

PipelineResource -u-o git
PipelineResource -u-o image
Pipeline -u-* PipelineResource
Pipeline -r-* Task
PipelineRun -u-* Pipeline
TaskRun -u-* Task

@enduml

### Argo

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Argo"

object DWP
object Redis
object AgroResource
object ArgoSensor
object ArgoTrigger
object ArgoWorkflow

DWP -d- Redis : message
Redis -d- AgroResource : listner
AgroResource -r- ArgoSensor
ArgoSensor -r- ArgoTrigger
ArgoTrigger -r- ArgoWorkflow

@enduml

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Argo"

participant DWP
participant Redis
participant AgroResource
participant ArgoSensor
participant ArgoTrigger
participant ArgoWorkflow

DWP -> Redis : task message
Redis -> AgroResource : listner
AgroResource -> ArgoSensor : sensor
ArgoSensor -> ArgoTrigger : trigger
ArgoTrigger -> ArgoWorkflow : run

@enduml