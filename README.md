Goal
====

The goal of this project is to create a nice literate programming
environment that allows intermixing of code of different technical
computing languages with markdown text and rich media output.

Although I did not yet succeed in setting up such an environment
completely as desired, I still will always make my current settings
available to others via [docker](www.docker.com). This way, you can
re-use and further customize my software development environment with
minimal effort.

In line with my own software preferences, the computing environment
ultimately should comprise support for the following technical
computing languages:
- R
- Julia
- Matlab

Currently, I know about three different environments for literate
programming that could be used to achieve a literate programming
environment: 
- [IPython](http://ipython.org/)
- [Beaker](http://beakernotebook.com/)
- [emacs + org-babel](http://orgmode.org/worg/org-contrib/babel/) 

In addition, however, we still would like to be able to conveniently
edit and run source files as well, so that IPython / Beaker alone
would not be sufficient. For source file editing, I usually rely on
emacs.

Obstacles
---------

One main obstacle is directly due to the nature of docker virtual
environments: there simply is a difference between installing and
especially USING interactive software on a desktop computer and a
virtual machine / server.

When installing a program with GUI at your desktop pc, you immediately
can use its GUI right away. Running the same software on a server,
however, requires you to explicitly deal with getting any output back
to the client computer where you actual want to see the results.
Hence, any picture output windows or browser tabs need to be forwarded
to the client. For some programs there exist simple extensions that
handle this problem for you: RStudio Server for RStudio or running an
IPython server. In all other cases, however, you still need to deal
with this problem on your own.

In addition, there currently exist some further problems with
individual software components, and they will be listed below. 

IPython
=======

Allow to start notebook with multiple languages using respective
IPython magics:
- [rpy2](http://rpy.sourceforge.net/): seems to work
- [pyjulia](https://github.com/JuliaLang/pyjulia):
  - according to
    [this](http://blog.leahhanson.us/julia-calling-python-calling-julia.html)
    blog post, calling Julia from Python should be able in principle, but:
    - commands need to be called within function `j.run("x = 5")`
    - code did originally reside in IJulia package, but seems to be
      broke after moving to pyjulia
  - according to
    [this](http://stackoverflow.com/questions/24091373/best-way-to-run-julia-code-in-an-ipython-notebook-or-python-code-in-an-ijulia-n)
    page, Julia magics should be running with some minor tweaks, but:
    - code blocks do not print standard output for cells
      (e.g. println("hello world"))
- [pymatbridge](http://arokem.github.io/python-matlab-bridge/):
  - according to
    [this](http://nbviewer.ipython.org/gist/anonymous/8940322)
    notebook, Matlab magics should be able in IPython, but:
    - I could not get Matlab to start

In principle, IPython magics should work. Still, however, it would
require to put a `%%language` tag at the beginning of each cell. This,
however, could be fixed in IPython3.0, as different kernels could be
selected within the [notebook user
interface](http://ipython.org/ipython-doc/dev/whatsnew/development.html). 

An alternative interface for interweaving of several software kernels
could be the [jupyter project](http://jupyter.org/), which is also
built on IPython.

Beaker
======

- based on Ubuntu (opposed to Rocker images)
- for built it requires files in github folder
- currently doesn't built
- also: running image from
  [hub.docker](https://registry.hub.docker.com/u/beakernotebook/beaker/)
  currently does not work 

````
docker run -p 8800:8800 -t beakernotebook/beaker
````

R
====

Rocker images are built on Debian, so that they probably should be
ported to Ubuntu in order to make them work with Julia, IPython and
beaker. However, if you only want to work with R itself, you can
easily make use of the respective
[rocker](https://github.com/rocker-org/rocker/wiki) image. 

In my case, this amounts to loading the hadleyverse image, which
already builds upon the [rstudio
image](https://github.com/rocker-org/hadleyverse/blob/master/Dockerfile).
I then only need to customize the installed packages to comprise the
ones that I need.

rfinmetrix_debian

For source file editing:
- run RStudio server
- 

##### build debian image


````
docker build -t jfinmetrix/rfinm_deb .
````

##### run RStudio

````
docker run -d -p 8787:8787 jfinmetrix/rfinm_deb rstudiostart
````

##### run console with graphics windows

With emacs:
- start shell in emacs
- start container:
````
docker run -it --rm -e DISPLAY=$DISPLAY -u docker -v /tmp/.X11-unix:/tmp/.X11-unix --name="rfinm_deb" jfinmetrix/rfinm_deb bash
````
or with home directory mounted:
````
docker run -it --rm -e DISPLAY=$DISPLAY -u docker -v /tmp/.X11-unix:/tmp/.X11-unix  -v ./:/home/docker/ --name="rfinm_deb" jfinmetrix/rfinm_deb bash
````
- M-x ess-remote


##### run terminal in image

````
docker run --rm -it jfinmetrix/rfinm_deb bash
````


Julia
=====

Source file editing:
- with emacs ess-remote: not working
- directly working in terminal: 
  - using Winston throws error if X11 forwarding is not activated


docker
======


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
