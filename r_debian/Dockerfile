# in directory containing dockerfile, build with:
# docker build -t juliafinmetrix/rfinm_deb .

FROM rocker/hadleyverse

MAINTAINER "Christian Groll" groll.christian.edu@gmail.com

# install financial econometrics packages
RUN install2.r --error --deps TRUE \
    CDVine \
    fGarch \
    zoo \
    sde \
    tseries && \
    rm -rf /tmp/downloaded_packages/

# make symbolic link for nicer starting command
RUN ln -s /usr/bin/supervisord /usr/bin/rstudiostart

USER docker
WORKDIR /home/docker/

CMD ["/usr/bin/supervisord"] 
