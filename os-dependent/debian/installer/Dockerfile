FROM ubuntu:20.04

RUN apt-get update
RUN apt-get -y install bridge-utils
RUN apt-get -y install net-tools
RUN apt-get -y install docker.io
RUN apt-get -y install vim

CMD bash /installer/install.sh