# Multi Cluster 구축
- 구축 목표
    - Control Plane 과 Data Planes 으로 구성한다.
    - Cluster 에 설치되는 기본 컴포넌트의 설치를 자동화 한다.
    - Cluster EndPoint 관리를 자동화 한다.
    - DWP 에서 Cluster Resource 제어시 Task Runner 를 적용한다.
    - DWP 에서 Cluster Resource 제어시 async, non-block 을 적용한다.
    - DWP 에서 Cluster Resource 제어시 status monitoring 을 적용한다.
    - Access Log 를 Application 외부에서 처리하거나 최소한 Redis 직접 접속은 제거한다

## Deployment Diagram
### Site A
- Site B 에서 사용하는 컴포넌트만 표시함
- Docker registry 로 Harbor 를 사용함
- Task 기반 비동기 처리를 위해 TaskAgent, NotifyAgent 를 사용함 

@startuml

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

rectangle "site A" as a {
    rectangle "Common Service" as a_comm {
        [SSO] as a_comm_sso
        [Cube] as a_comm_cube
        [CDN] as a_comm_cnd
        [SMTP] as a_comm_smtp
    }
    rectangle "CI/CD" as hcp_cicd {
        [Nexus] as hcp_cicd_nexus
        [Bitbucket] as hcp_cicd_bitbucket
        [Jira] as hcp_cicd_jira
        [Harbor] as hcp_cicd_harbor #orange
    }
    node "Platfrom Plane" as hcp {
        rectangle "Portal" as hcp_portal {
            [WP] as hcp_portal_wp
            [DWP] as hcp_portal_dwp
            [Redis-WP] as hcp_portal_rediswp
            [Redis-DWP] as hcp_portal_redisdwp
            hcp_portal_wp -- hcp_portal_rediswp
            hcp_portal_dwp -- hcp_portal_redisdwp
        }
        rectangle "Task Service" as hcp_agent {
            [TaskAgent] as hcp_agent_taskagent #orange
            [NotifyAgent] as hcp_agent_notifyagent #orange
        }
    }
}

@enduml

### Site B
- Control Plane, Data Plane 으로 구분
- Platform Plane 과의 통신을 TaskRunner 를 이용
- Docker registry 로 Harbor 사용
- Gitee 는 사용자 git repository 로 사용됨
- Platform 에서 배포에 사용되는 source 는 Bitbucket 을 사용함
- Cluster 컴포넌트 관리를 위해 ArgoCD 를 사용함
- Monitoring/Alert 컴포넌트는 long-terms 와 short-terms 를 구분함

@startuml

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

node "Control Plane" as bcp {
    rectangle "Task Service" as bcp_cicd {
        [TaskRunner] as bcp_taskruuner #orange
        [ArgoCD] as bcp_argocd #orange
    }
    rectangle "CI/CD Service" as bcp_common {
        [Gitee] as gitee #orange
        [Nexus] as nexus
        [SonarQube] as sonarqube
        [Harbor] as harbor #orange
    }
    rectangle "Monitoring/Alert" as bcp_mon {
        [Elastic-Search\n(long-terms)] as bcp_mon_elk
        [Grafana\n(long-terms)] as bcp_mon_grafana
        [Kibana\n(long-terms)] as bcp_mon_kibana
        [Prometheus\n(long-terms)] as bcp_mon_prometheus
    }
    rectangle "Managed Service" as bcp_managed {
        [Redis] as bcp_mananged_redis
    }
}

@enduml

@startuml

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

node "Data Plane" as bdp {
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
    }
}

@enduml

## Cluster Management
- Cluster 를 새로 구축하는 경우 절차를 기술함
- Site Cluster 에 설치될 컴포넌트는 ArgoCD 로 관리함
- 배포 상태 관리는 ArgoCD Dashboard 를 사용함

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Cluster Management"

Actor Manager
box "site A CI/CD"
    participant Bitbucket
end box
box "site B control plane"
    participant "ArgoCD-Dashboard" as argocddash
    participant ArgoCD
    participant k8s_control
end box
box "site B data plane"
    participant k8s_data
end box

autonumber 1-1
    Manager -> Bitbucket : git push yml
autonumber 2-1
    Manager -> argocddash : create project
    Manager -> argocddash : create cluster
    Manager -> argocddash : create repository
    Manager -> argocddash : create application
autonumber 3-1
    Manager -> argocddash : sync yml
    argocddash -> ArgoCD : sync yml
    ArgoCD -> Bitbucket : checkout yml
    ArgoCD -> k8s_control : check diff
    ArgoCD -> k8s_control : deploy
    ArgoCD -> Bitbucket : checkout yml
    ArgoCD -> k8s_data : check diff
    ArgoCD -> k8s_data : deploy
autonumber 4-1
    Manager -> argocddash : monitoring
    ArgoCD --> argocddash : stream: server-sent-event

@enduml

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
    participant Jira
end box

autonumber 1-1
User -> DWP : create app.
DWP -\ TaskAgent : run task
activate TaskAgent
TaskAgent -> source : checkout source template
TaskAgent -> source : create repository
TaskAgent -> source : push source
TaskAgent -> yaml : checkout yaml template
TaskAgent -> yaml : create repository
TaskAgent -> yaml : push yaml
TaskAgent -> Jira : create jira project
TaskAgent --\ NotifyAgent : send notify
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
box "site A - platform plane"
    participant DWP
    participant CUBE
    participant NotifyAgent
    participant TaskAgent
    participant "Bitbucket\n(source)" as source
end box
box "site B - control plane"
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
activate TaskRunner
TaskRunner -> source : checkout source
TaskRunner -> TaskRunner : build application
TaskRunner -> Nexus : download libs
TaskRunner -> TaskRunner : build dockerfile
TaskRunner -> Harbor : push docker image
Harbor -\ Harbor : scan docker image
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
box "site A - platform plane"
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
DWP -\ TaskAgent : run task
TaskAgent -> TaskAgent : discovery taskrunner
TaskAgent -\ TaskRunner : run task
activate TaskRunner
TaskRunner -> yaml : checkout yaml
TaskRunner -> TaskRunner : modify yaml
TaskRunner -> yaml : push yaml
TaskRunner -> ArgoCD : if not exists app. then \n   create app.
TaskRunner -\ ArgoCD : run deploy
ArgoCD -> yaml : chcekout yaml
ArgoCD -> k8s : diff yaml
ArgoCD -\ k8s : deploy yaml
k8s -\ k8s : run deploy/pod
k8s -\ Harbor : pull docker image
TaskRunner --\ NotifyAgent : notify status
NotifyAgent --\ CUBE : send message

autonumber 4-1
User -> DWP : view status

@enduml


## ETC
- TaskRunner 로 사용 가능한 Open Source 정리

### Argo Workflow

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Argo Workflow"

agent TaskAgent
rectangle ArgoWorkflow {
    collections Workflow
    agent WorkflowTemplate
}
rectangle k8s {
    collections pod
}

TaskAgent -r- WorkflowTemplate : run workflow
WorkflowTemplate -d- Workflow : create workflow
Workflow -r- pod : create/run pod

@enduml

### Argo Event

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Argo Event"

object DWP
object Redis
package ArgoEvent {
    object AgroResource
    object ArgoSensor
    object ArgoTrigger
}
package ArgoWorkflow {
    object ArgoWorkflow
}

DWP -d- Redis : message
Redis -d- AgroResource : listner
AgroResource -r- ArgoSensor
ArgoSensor -r- ArgoTrigger
ArgoTrigger -d- ArgoWorkflow

@enduml

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Argo Event"

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

### Tekton

@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "Tekton"

object git
object image
package tekton {
    object Pipeline
    object PipelineRun
    object PipelineResource
    object Task
    object TaskRun
}

PipelineResource -u-o git
PipelineResource -u-o image
Pipeline -u-* PipelineResource
Pipeline -r-* Task
PipelineRun -u-* Pipeline
TaskRun -u-* Task

@enduml