# Application Architecture
  
@startuml
"client"
node "EKS (ns: session-dev/prd)" as EKS {
  (ingress)
  node "mariadb" {
    database "salaries"
    database "departments"
    database "employees"
  }
  node "redis" {
    database "session"
    database "cache"
  }
  node "REST API" as REST {
    [salary-node] as salary
    [dept-spring] as dept
    [emp-spring] as emp
  }
}
ingress --> emp
ingress --> dept
ingress --> salary
client -> ingress
emp <--> employees
dept <--> departments
salary <--> salaries
emp <--> session
cache <--> dept
salary - emp
emp - dept
@enduml
