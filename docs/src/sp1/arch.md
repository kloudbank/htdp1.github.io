# Application Architecture
  
@startuml
"client"
node "EKS (ns: session-dev/prd)" as eks {
  (ingress)
  rectangle "Redis" as redis {
    database "session"
    database "cache"
  }
  rectangle "MariaDB" as mariadb {
    database "salaries"
    database "departments"
    database "employees"
  }
  rectangle "API" as api {
    [salary-node] as salary
    [dept-spring] as dept
    [emp-spring] as emp
  }
}
client -right-> ingress
ingress -right-> emp
ingress -right-> dept
ingress -right-> salary
emp <--> employees
dept <--> departments
salary <--> salaries
emp <--> session
cache <--> dept
salary -up- dept
dept -up- emp
@enduml
