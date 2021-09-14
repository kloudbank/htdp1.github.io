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
    rectangle "Portal" as a_portal {
        [WP] as hcp_portal_wp
        [DWP] as hcp_portal_dwp
        [Redis-WP] as hcp_portal_rediswp
        [Redis-DWP] as hcp_portal_redisdwp
    }
    rectangle "CI/CD" as hcp_cicd {
        [Bitbucket] as hcp_cicd_bitbucket
    }
    [TaskAgent] as hcp_agent #orange
}
@enduml

### Site B
- Control Plane, Data Plane 으로 구분

@startuml

title "Site B"

node "Control Plane" as bcp {
    rectangle "CI/CD" as bcp_cicd {
        [Jenkins] as bcp_cicd_jenkins
        [Nexus] as bcp_cicd_nexus
        [SonarQube] as bcp_cicd_sonarqube
        [ArgoCD] as bcp_cicd_argocd #orange
        [Harbor] as bcp_cicd_harbor #orange
    }
    rectangle "Monitoring/Alert\n(long-terms)" as bcp_mon {
        [Elastic-Search] as bcp_mon_elk
        [Grafana] as bcp_mon_grafana
        [Kibana] as bcp_mon_kibana
        [Prometheus] as bcp_mon_prometheus
    }
    rectangle "Managed Service" as bcp_mananged {
        [Redis] as bcp_mananged_redis
        [Gitee] as bcp_mananged_gitee #orange
    }
    [TaskRunner] as bcp_cicd_taskruuner #orange
}

@enduml

@startuml

[기존컴포넌트] as old
[신규컴포넌트] as new #orange
old -[hidden]d-> new

node "Data Plane" as dcp {
    rectangle "Biz" as bdp_bz {
        [Biz App. Backend] as bdp_bz_app
    }
    rectangle "Monitoring/Alert\n(short-terms)" as bdp_mon {
        [Elastic-Search] as bdp_mon_elk
        [Grafana] as bdp_mon_grafana
        [Kibana] as bdp_mon_kibana
        [Prometheus] as bdp_mon_prometheus
        [loki] as dbp_mon_loki #orange
    }
}
@enduml

## Sequence Diagram
### Login SSO process
- Site A 사용자가 A url 과 B url 을 사용하여 로그인 할 경우
    - case1 and case2
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
@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "App. 생성"

actor User
box "site A"
participant DWP
participant CUBE
participant Bitbucket
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
DWP -\ TaskAgent : create job (async)
TaskAgent -\ TaskRunner : create app.
TaskRunner -> Bitbucket : checkout template
TaskRunner -> Bitbucket : push template
TaskRunner -> Jenkins : create job
TaskRunner -> ArgoCD : create application
TaskRunner -> Harbor : create docker repository
TaskRunner -> TaskAgent : call back
TaskAgent -> DWP : callback
DWP -\ CUBE : send message

autonumber 2-1
User -> DWP : view status

@enduml

### CI process
@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "App. CI"

actor User
box "site A"
participant DWP
participant CUBE
participant "Bitbucket\n(source)" as source
participant TaskAgent
end box
box "site B"
participant TaskRunner
participant Jenkins
participant Nexus
participant Harbor
end box

autonumber 1-1
User -> DWP : run CI
note left : CI
DWP -\ TaskAgent : run CI
TaskAgent -\ TaskRunner : run CI
TaskRunner -> Jenkins : run job
Jenkins -> source : checkout source
Jenkins -> Jenkins : app. build
Jenkins -> Nexus : download libs
Jenkins -> Jenkins : docker build
Jenkins -> Harbor : push docker image
TaskRunner -> TaskAgent : callbask
TaskAgent -> DWP : callbask
DWP -> CUBE : send message

autonumber 2-1
User -> DWP : view status

@enduml

### CD process
@startuml

scale 1
skinparam ParticipantPadding 5
skinparam BoxPadding 5
title "App. CD"

actor User
box "site A"
participant DWP
participant CUBE
participant "Bitbucket\n(yaml)" as yaml
participant TaskAgent
end box
box "site B"
participant TaskRunner
participant Jenkins
participant Harbor
participant ArgoCD
participant k8s
end box

autonumber 1-1
User -> DWP : run CD
note left : CD
DWP -\ TaskAgent : run CD
TaskAgent -\ TaskRunner : run CD
TaskRunner -> Jenkins : run job
Jenkins -> yaml : checkout yaml
Jenkins -> Jenkins : modify yaml
Jenkins -> yaml : push yaml
Jenkins -\ ArgoCD : run deploy
ArgoCD -> yaml : chcekout yaml
ArgoCD -> k8s : deploy yaml
k8s -> Harbor : pull docker image
TaskRunner -> TaskAgent : call back
TaskAgent -> DWP : call back
DWP -> CUBE : send message

autonumber 2-1
User -> DWP : view status

@enduml