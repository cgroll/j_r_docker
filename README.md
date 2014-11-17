j_r_docker
==========

This is a docker that let's you easily access pre-configured Julia and
R computing environments. The following access points are provided:

For notebook style data analysis:
- Beaker (both Julia and R)
- IPython notebook (both Julia and R via python magic)
- IJulia notebook (only Julia in IPython)

For source file editing:
- RStudio
- R terminal to connect for emacs remote ESS session

Note: so far, I did not manage to set up a nice interface to edit
Julia source files.


- install Julia
- install additional packages for Julia and R
- install IPython + required python magic packages
- set up IJulia
- install beaker

Access:
R through RStudio:
````R
# detached mode
# publish container's port to host
docker run -d -p 8787:8787 jfinmetrix/base_r rstudiostart
````

build command
=============

docker build -t jfinmetrix/rbase_ubuntu .
docker build -t jfinmetrix/rstudio_ubuntu .
docker build -t jfinmetrix/rhadley_ubuntu .
docker build -t jfinmetrix/beaker_ubuntu .


docker run -d -p 8787:8787 jfinmetrix/rhadley_ubuntu rstudiostart
docker run -it --rm -e DISPLAY=$DISPLAY -u docker -v /tmp/.X11-unix:/tmp/.X11-unix --name="rfinm" jfinmetrix/rhadley_ubuntu bash

docker build -t jfinmetrix/rfinm .
docker build -t jfinmetrix/beaker .


run commands
============

RStudio: 
docker run -d -p 8787:8787 jfinmetrix/rfinm rstudiostart

R console:
docker run --rm -it jfinmetrix/rfinm bash

R console with graphics:
docker run -it --rm -e DISPLAY=$DISPLAY \
-u docker \
-v /tmp/.X11-unix:/tmp/.X11-unix \
--name="rfinm" jfinmetrix/rfinm bash

docker run -it --rm -e DISPLAY=$DISPLAY -u docker -v /tmp/.X11-unix:/tmp/.X11-unix --name="rfinm" jfinmetrix/rfinm bash

Remove all containers:
docker rm `docker ps --no-trunc -aq`
