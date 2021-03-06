# #######################
# ## UBUNTU DOCKERFILE ##
# #######################

# ## R-Base
# ##-------

# ## start with the latest ubuntu
# FROM ubuntu:latest

# ## This handle reaches Carl and Dirk
# MAINTAINER "Carl Boettiger and Dirk Eddelbuettel" rocker-maintainers@eddelbuettel.com

# ## Remain current
# RUN apt-get update -qq \
# && apt-get dist-upgrade -y \
# && apt-get install -y software-properties-common

# ## Add CRAN repo to get current R
# RUN add-apt-repository "deb http://cran.rstudio.com/bin/linux/ubuntu $(lsb_release -cs)/" \
# && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E084DAB9

# ## Update again
# RUN apt-get update -qq \
# && apt-get dist-upgrade -y

# ## Now install R and littler, and create a link for littler in /usr/local/bin
# RUN apt-get update -qq \
# && apt-get install -y --no-install-recommends \
#     ed \
#     less \
#     littler \
#     r-base \
#     r-base-dev \
#     r-recommended \
#     vim-tiny \
#     wget \
# &&  ln -s /usr/share/doc/littler/examples/install.r /usr/local/bin/install.r \
# &&  ln -s /usr/share/doc/littler/examples/install2.r /usr/local/bin/install2.r \
# &&  ln -s /usr/share/doc/littler/examples/installGithub.r /usr/local/bin/installGithub.r \
# &&  ln -s /usr/share/doc/littler/examples/testInstalled.r /usr/local/bin/testInstalled.r \
# &&  install.r docopt \
# &&  rm -rf /tmp/downloaded_packages/ /tmp/*.rds

# ## Set a default CRAN Repo
# RUN echo 'options(repos = list(CRAN = "http://cran.rstudio.com/"))' >> /etc/R/Rprofile.site

# ## Set a default user. Available via runtime flag `--user docker` 
# ## Add user to 'staff' group, granting them write privileges to /usr/local/lib/R/site.library
# ## User should also have & own a home directory (for rstudio or linked volumes to work properly). (could use adduser to create this automatically instead)
# RUN useradd docker \
# && mkdir /home/docker \
# && chown docker:docker /home/docker \
# && addgroup docker staff

# ## Configure default locale
# RUN echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen \
# && locale-gen en_US.utf8 \
# && /usr/sbin/update-locale LANG=en_US.UTF-8
# ENV LC_ALL en_US.UTF-8


###############################################################
###############################################################
###############################################################

# ## R-Studio
# ##---------

# ## start with the latest ubuntu
# FROM jfinmetrix/rbase_ubuntu

# ## discourage apt from prompting the user for input
# ENV DEBIAN-FRONTEND noninteractive

# ## Download and install RStudio server
# RUN echo "deb http://archive.ubuntu.com/ubuntu trusty-backports main restricted universe" >> /etc/apt/sources.list \
# && apt-get update && apt-get install -y -q \
#    libapparmor1 \
#    libcurl4-openssl-dev \
#    libssl0.9.8 \
#    psmisc \
#    supervisor \
#    sudo \
# && update-locale \
# && (wget -q https://s3.amazonaws.com/rstudio-server/current.ver -O currentVersion.txt \
# && ver=$(cat currentVersion.txt) \
# && wget http://download2.rstudio.org/rstudio-server-${ver}-amd64.deb \
# && dpkg -i rstudio-server-${ver}-amd64.deb \
# && rm rstudio-server-*-amd64.deb currentVersion.txt)

# ## This shell script is executed by supervisord when it is run by CMD, configures env variables
# COPY userconf.sh /usr/bin/userconf.sh

# ## Configure persistent daemon serving RStudio-server on (container) port 8787
# RUN mkdir -p /var/log/supervisor
# COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# EXPOSE 8787

# # make symbolic link for nicer starting command
# RUN ln -s /usr/bin/supervisord /usr/bin/rstudiostart

###############################################################
###############################################################
###############################################################

## Hadleyverse
##------------

# ## Provides: 
# # - ggplot2, devtools, dplyr, tidyr, reshape2, testthat, plyr, httr, roxygen2
# # - knitr, rmarkdown, shiny
# # - rcpp
# #
# # along with all dependencies and SUGGESTed packages, including database tools (MySQL, PostgreSQL)
# # Also provides related development and dynamic documentation tools (compilers, pandoc, latex)
# # and inherits the rstudio-server and git tools from the base image, rstudio.

# FROM jfinmetrix/rstudio_ubuntu

# ## This handle reaches Carl and Dirk
# MAINTAINER "Carl Boettiger and Dirk Eddelbuettel" rocker-maintainers@eddelbuettel.com

# ## Add CRAN binaries and update
# RUN add-apt-repository -s -y ppa:marutter/c2d4u 

# ## rmarkdown-related dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     ghostscript \
#     imagemagick \
#     libpq-dev \
#     librsvg2-bin \
#     lmodern \ 
#     pandoc \
#     pandoc-citeproc \
#     texlive-fonts-recommended \
#     texlive-humanities \ 
#     texlive-latex-extra 

# ## Package build dependencies
# # RUN apt-get update && apt-get build-dep -y \
# #     r-cran-rgl \
# #     r-cran-rjava \
# #     r-cran-rmysql \
# #     r-cran-rsqlite \
# #     r-cran-xml

# ## Finally ready to install the R packages.  NOTE: failure to install a package doesn't throw an image build error. 
# ## Install devtools, ggplot2, dplyr, tidyr + full suggests lists

# RUN Rscript -e "install.packages('devtools',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('ggplot2',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('dplyr',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('knitr',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('Rcpp',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('reshape2',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('rmarkdown',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('roxygen2',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('roxygen2',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('CDVine',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('fGarch',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('zoo',,'http://cran.us.r-project.org')"
# RUN Rscript -e "install.packages('tseries',,'http://cran.us.r-project.org')"
    
# # RUN install2.r --error --deps TRUE \
#     # devtools \
#     # ggplot2 \
#     # dplyr \
#     # httr \ 
#     # knitr \
#     # Rcpp \
#     # reshape2 \
#     # rmarkdown \
#     # roxygen2 \
#     # testthat \
#     # tidyr && \
#     # rm -rf /tmp/downloaded_packages/

# ## Add a few github repos where the CRAN version isn't sufficiently recent (e.g. has outstanding bugs) 
# RUN installGithub.r hadley/reshape \
# && rm -rf /tmp/downloaded_packages/ /tmp/*.rds


# ## Run tests 
# #RUN mkdir tests \
# #&& Rscript  --default-packages="stats, graphics, grDevices, datasets, utils, methods, base" -e 'fail <- sapply(c("devtools", "ggplot2", "dplyr", "tidyr", "reshape2", "roxygen2", "knitr", "testthat", "rmarkdown", "httr", "Rcpp"), tools:#:testInstalledPackage, type=c("tests", "examples"), outDir="tests"); print(fail)'\
# #&& rm -r tests


###############################################################
###############################################################
###############################################################

FROM jfinmetrix/rhadley_ubuntu

MAINTAINER Beaker Feedback <beaker-feedback@twosigma.com>

RUN apt-get update
RUN apt-get dist-upgrade -y

RUN apt-get install -y software-properties-common python-software-properties

RUN add-apt-repository -y ppa:webupd8team/java
RUN add-apt-repository -y ppa:chris-lea/zeromq
RUN add-apt-repository -y ppa:marutter/rrutter
RUN add-apt-repository -y ppa:staticfloat/juliareleases
RUN add-apt-repository -y ppa:staticfloat/julia-deps 
RUN add-apt-repository -y ppa:chris-lea/node.js
RUN add-apt-repository -y ppa:cwchien/gradle

RUN apt-get update

RUN apt-get install -y nginx gradle-1.12 python g++ make git


##########
#  Java  #
##########

RUN echo debconf shared/accepted-oracle-license-v1-1 select true | debconf-set-selections
RUN apt-get install -y oracle-java7-installer

############
#  Python  #
############

# First install zmq3:
RUN apt-get install -y libzmq3-dbg libzmq3-dev libzmq3

# Then IPython proper:
RUN apt-get install -y python-pip python-dev python-yaml
RUN pip install ipython jinja2 tornado pyzmq pandas rpy2 

# And some useful libraries:
RUN apt-get install -y python-matplotlib python-scipy

#######
#  R  #
#######

RUN apt-get install -y r-base r-base-dev libcurl4-gnutls-dev
RUN Rscript -e "install.packages('Rserve',,'http://cran.us.r-project.org')"
RUN Rscript -e "install.packages('ggplot2',,'http://cran.us.r-project.org')"
RUN Rscript -e "install.packages('devtools',,'http://cran.us.r-project.org')"
RUN Rscript -e "install.packages('RJSONIO',,'http://cran.us.r-project.org')"
RUN Rscript -e "install.packages('RCurl',,'http://cran.us.r-project.org')"

###########
#  Julia  #
###########

RUN apt-get install -y julia
RUN julia --eval 'Pkg.add("IJulia")'
RUN julia --eval 'Pkg.add("Gadfly")'

##########
#  Ruby  #
##########

# First install zmq3, as per Python instructions above. Then:
RUN apt-get install -y ruby1.9.1 ruby1.9.1-dev
RUN gem install iruby

##########
#  Node  #
##########

RUN apt-get install -y nodejs

ENV NODE_PATH /usr/local/lib/node_modules
RUN npm config --global set cache /home/beaker/.npm && \
    npm config --global set registry http://registry.npmjs.org/

###################
#  Build and Run  #
###################

RUN useradd beaker --create-home
ADD . /home/beaker/src
ENV HOME /home/beaker

# Run these again. When they ran above, they installed in ~root but we
# need to find them in ~beaker.  Unfortunately we can't run just once
# here because in addition to those files, they also run some apt-gets
# which need to go as root.
RUN su -m beaker -c "julia --eval 'Pkg.add(\"IJulia\")'"
RUN su -m beaker -c "julia --eval 'Pkg.add(\"Gadfly\")'"

RUN chown -R beaker:beaker /home/beaker
RUN su -m beaker -c "cd /home/beaker/src  && gradle build"
# EXPOSE 8800
# EXPOSE 8787
WORKDIR /home/beaker/src
CMD su -m beaker -c "export PATH=$PATH:/usr/sbin && /home/beaker/src/core/beaker.command --public-server"

# ###################
# #  Build and Run  #
# ###################

# # RUN useradd beaker --create-home
# ADD ./build-sharing-server /home/docker/src
# # RUN su -m docker -c "mkdir /home/docker/src"
# ENV HOME /home/docker

# # Run these again. When they ran above, they installed in ~root but we
# # need to find them in ~beaker.  Unfortunately we can't run just once
# # here because in addition to those files, they also run some apt-gets
# # which need to go as root.
# # RUN su -m docker -c "julia --eval 'Pkg.add(\"IJulia\")'"
# # RUN su -m docker -c "julia --eval 'Pkg.add(\"Gadfly\")'"

# # RUN su -m beaker -c "julia --eval 'Pkg.add(\"IJulia\")'"
# # RUN su -m beaker -c "julia --eval 'Pkg.add(\"Gadfly\")'"


# RUN su -m docker -c "cd /home/docker/src  && gradle build"
# EXPOSE 8800
# # WORKDIR /home/docker/src
# # CMD su -m docker -c "export PATH=$PATH:/usr/sbin && /home/docker/src/core/beaker.command --public-server"


###############################################################
###############################################################
###############################################################


# #######################
# ## DEBIAN DOCKERFILE ##
# #######################

# FROM rocker/hadleyverse

# MAINTAINER Christian Groll groll.christian.edu@gmail.com


# ##################################
# ## packages installed by beaker ##
# ##################################

# # RUN apt-get install -y libcurl4-gnutls-dev

# # RUN install2.r --error --deps TRUE \
# #     devtools \
# #     Rserve \
# #    RCurl \
# #     RJSONIO && \
# #     rm -rf /tmp/downloaded_packages/

# ########################
# ## install R packages ##
# ########################

# RUN install2.r --error --deps TRUE \
#     CDVine \
#     fGarch \
#     zoo \
#     tseries && \
#     rm -rf /tmp/downloaded_packages/

# EXPOSE 8787

# # make symbolic link for nicer starting command
# RUN ln -s /usr/bin/supervisord /usr/bin/rstudiostart



# # CMD ["/usr/bin/supervisord"] 
