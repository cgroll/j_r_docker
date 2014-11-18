FROM rocker/hadleyverse

MAINTAINER "Christian Groll" groll.christian.edu@gmail.com

# install financial econometrics packages
RUN install2.r --error --deps TRUE \
    CDVine \
    fGarch \
    zoo \
    tseries && \
    rm -rf /tmp/downloaded_packages/

# make symbolic link for nicer starting command
RUN ln -s /usr/bin/supervisord /usr/bin/rstudiostart

CMD ["/usr/bin/supervisord"] 
