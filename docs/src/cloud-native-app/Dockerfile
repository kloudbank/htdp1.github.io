FROM {Container Registry URI}/{Project Name}/{Repository Name}:{Tag}

# Container에 필요한 설치 설정 등을 위한 Shell Command 실행
# 여러 명령어 블럭 실행 가능
RUN {Shell Command}

USER {user:[group]}

# 작업되는 실행 경로 설정
# 여러 명령어 블럭 실행 가능
WORKDIR {/the/workdir/path}

# Container OS에 환경변수 설정
# 여러 명령어 블럭 실행 가능
ENV {ENV-KEY} {Value}

# Container에 파일 복사
# 여러 명령어 블럭 실행 가능
ADD {src} {destination}

# Container에 파일 복사
# 여러 명령어 블럭 실행 가능
COPY {src} {destination}

# Container에 필요한 설치 설정 등을 위한 Shell Command 실행
# 여러 명령어 블럭 실행 가능
RUN {Shell Command}

# Continaer에서 사용되는 port를 외부로 노출시킨다.
# ex) springboot port 8080
EXPOSE 8080
# Container에서 추가적인 port를 오출시키는 경우 추가 지정
EXPOSE 9090

# 선택사항으로 Container 시작을 위한 기본 실행 명령어
ENTRYPOINT {Shell Command}

# 선택사항으로 Container 시작을 위한 ENTRYPOINT에 확장 명령어 처리
# ENTRYPOINT 없는 경우 전체 실행 명령어 지정 가능
# Docker run에 의해 override되는 영역으로 재정의 가능 함
CMD {Shell command extending to ENTRYPOINT }