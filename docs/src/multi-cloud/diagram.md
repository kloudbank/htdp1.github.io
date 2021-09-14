## Deployment Diagram
@startuml

title "Deployment Diagram"

rectangle "Site A" as a {
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
            [Jenkins] as hcp_cicd_jenkins
            [SonarQube] as hcp_cicd_sonarqube
            [Nexus] as hcp_cicd_nexus
            [ArgoCD] as hcp_cicd_argocd #orange
            [Harbor] as hcp_cicd_harbor #orange
            [TaskRunner] as hcp_cicd_taskrunner #orange
        }
    }
}

rectangle "Site B" as b {
    node "Control Plane" as bcp {
        rectangle "CI/CD" as bcp_cicd {
            [Jenkins] as bcp_cicd_jenkins
            [Nexus] as bcp_cicd_nexus
            [SonarQube] as bcp_cicd_sonarqube
            [ArgoCD] as bcp_cicd_argocd #orange
            [Harbor] as bcp_cicd_harbor #orange
            [TaskAgent] as bcp_cicd_taskagent #orange
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
    }

    node "Data Plane" as bdp {
        rectangle "Biz" as bdp_bz {
            [Biz App. Backend] as bdp_bz_app
        }
        rectangle "Monitoring/Alert\n(short-terms)" as bdp_mon {
            [Elastic-Search] as bdp_mon_elk
            [Grafana] as bdp_mon_grafana
            [Kibana] as bdp_mon_kibana
            [Prometheus] as bdp_mon_prometheus
        }
    }
}

[기존컴포넌트] as old
[신규컴포넌트] as new #orange

@enduml

## Login SSO process
@startuml

scale 1
skinparam ParticipantPadding 10
skinparam BoxPadding 10
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
autonumber 4-1
b_user -> a_wp : login
note right : case4
a_wp -> a_sso : authentication
a_sso -> a_wp : redirect url
a_wp -> b_user : success

@enduml

## Create application process
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
participant TaskRunner
end box
box "site B"
participant TaskAgent
participant Jenkins
participant ArgoCD
participant Harbor
end box

autonumber 1-1
User -> DWP : create app.
DWP -\ TaskRunner : create job (async)
TaskRunner -> Bitbucket : checkout template
TaskRunner -> Bitbucket : push template
TaskRunner -> TaskAgent : create app.
TaskAgent -> Jenkins : create job
TaskAgent -> ArgoCD : create app.
TaskAgent -> Harbor : create docker repository
TaskRunner -> DWP : callback
DWP -\ CUBE : send message

@enduml

## Deploy application process
@startuml

scale 1
skinparam ParticipantPadding 10
skinparam BoxPadding 10
title "App. 배포"

actor User
box "site A"
participant DWP
participant CUBE
participant "Bitbucket(source)" as source
participant "Bitbucket(yaml)" as yaml
end box
box "site B"
participant Jenkins #orange
participant Nexus #orange
participant Harbor #orange
participant ArgoCD #orange
participant k8s #orange
end box

autonumber 1-1
User -> DWP : run CI
DWP -> Jenkins : run job
Jenkins -> source : checkout source
Jenkins -> Jenkins : app build
Jenkins -> Nexus : download libs
Jenkins -> Jenkins : docker build
Jenkins -> Harbor : push docker image
Jenkins -> CUBE : send message

autonumber 2-1
User -> DWP : run CD
DWP -> Jenkins : run job
Jenkins -> yaml : checkout yaml
Jenkins -> DWP : get resources
Jenkins -> Jenkins : modify yaml
Jenkins -> yaml : push yaml
Jenkins -> ArgoCD : run deploy
ArgoCD -> yaml : sync yaml
ArgoCD -> k8s : deploy yaml
k8s -> Harbor : pull docker image
Jenkins -> CUBE : send message

@enduml