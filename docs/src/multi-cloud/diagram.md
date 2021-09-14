# Diagram
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
}
node "hcp" as hcp {
    rectangle "Portal" as hcp_portal {
        [WP] as hcp_portal_wp
        [DWP] as hcp_portal_dwp
        [Redis-WP] as hcp_portal_rediswp
        [Redis-DWP] as hcp_portal_redisdwp
    }
    rectangle "CI/CD" as hcp_cicd {
        [Bitbucket] as hcp_cicd_bitbucket
    }
    rectangle "Agent Service" as hcp_agent {
        [TaskAgent] as hcp_agent_taskagent #orange
        [NotifyAgent] as hcp_agent_notifyagent #orange
    }
}
@enduml

### Site B
- Control Plane, Data Plane 으로 구분

@startuml

title "Site B"

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

node "Control Plane" as bcp {
    rectangle "CI/CD" as bcp_cicd {
        [Jenkins] as bcp_cicd_jenkins
        [Nexus] as bcp_cicd_nexus
        [SonarQube] as bcp_cicd_sonarqube
        [ArgoCD] as bcp_cicd_argocd #orange
        [Harbor] as bcp_cicd_harbor #orange
    }
    rectangle "Monitoring/Alert" as bcp_mon {
        [Elastic-Search\n(long-terms)] as bcp_mon_elk
        [Grafana\n(long-terms)] as bcp_mon_grafana
        [Kibana\n(long-terms)] as bcp_mon_kibana
        [Prometheus\n(long-terms)] as bcp_mon_prometheus
    }
    rectangle "Common Service" as bcp_comm {
        [Redis] as bcp_mananged_redis
        [Gitee] as bcp_mananged_gitee #orange
    }
    rectangle "Agent Service" as bcp_agent {
        [TaskRunner] as bcp_comm_taskruuner #orange
    }
}

@enduml

@startuml

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

node "Data Plane" as dcp {
    rectangle "Biz" as bdp_bz {
        [Biz-App.-Backend] as bdp_bizapp
    }
    rectangle "Monitoring/Alert" as bdp_mon {
        [Elastic-Search\n(short-terms)] as bdp_mon_elk
        [Grafana\n(short-terms)] as bdp_mon_grafana
        [Kibana\n(short-terms)] as bdp_mon_kibana
        [Prometheus\n(short-terms)] as bdp_mon_prometheus
        [loki\n(short-terms)] as dbp_mon_loki #orange
    }
}
@enduml

## Sequence Diagram
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
participant "Bitbucket\n(source)" as source
participant "Bitbucket\n(yaml)" as yaml
participant TaskAgent
end box
box "site B"
participant TaskRunner
participant Jenkins
participant ArgoCD
participant Harbor
end box

autonumber 1-1
User -> DWP : create app.
DWP -\ TaskAgent : create app
TaskAgent -\ TaskRunner : create app.
TaskRunner -> source : checkout source template
TaskRunner -> source : push source
TaskRunner -> yaml : checkout yaml template
TaskRunner -> yaml : push yaml
TaskRunner -> Jenkins : create pipeline
TaskRunner -> ArgoCD : create application
TaskRunner -> Harbor : create docker repository
TaskRunner -> TaskAgent : call back
TaskAgent -> NotifyAgent : send notify
NotifyAgent -\ CUBE : send message

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
TaskAgent -\ NotifyAgent : send notify
NotifyAgent -\ CUBE : send message

autonumber 2-1
TaskRunner -> source : checkout source
TaskRunner -> Nexus : download libs
TaskRunner -> TaskRunner : app. build
TaskRunner -> TaskRunner : docker build
TaskRunner -> Harbor : push docker image
TaskRunner -> SonarQube : check source
TaskRunner -\ NotifyAgent : send notify
NotifyAgent -\ CUBE : send message

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
box "site B"
participant TaskRunner
participant ArgoCD
participant k8s
participant Harbor
end box

autonumber 1-1
User -> DWP : run CD
note left : CD
DWP -\ TaskAgent : run task
TaskAgent -> TaskAgent : discovery taskrunner
TaskAgent -\ TaskRunner : run task
TaskAgent -\ NotifyAgent : notify status
NotifyAgent -> CUBE : send message

autonumber 2-1
TaskRunner -> yaml : checkout yaml
TaskRunner -> TaskRunner : modify yaml
TaskRunner -> yaml : push yaml
TaskRunner -\ ArgoCD : run deploy
TaskRunner -\ NotifyAgent : notify status
NotifyAgent -> CUBE : send message

autonumber 3-1
ArgoCD -> yaml : chcekout yaml
note right : sync yaml
ArgoCD -\ k8s : deploy yaml
k8s -> Harbor : pull docker image

autonumber 4-1
User -> DWP : view status

@enduml

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

PipelineResource -u-* git
PipelineResource -u-* image
Pipeline -u-* PipelineResource
Pipeline -r-* Task
PipelineRun -u-* Pipeline
TaskRun -u-* Task

@enduml