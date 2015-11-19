grunt-dockapp
=============

> Task deploying your node application under [Docker container](https://www.docker.com/).

Grunt plugin to deploy your application under Docker containers.

This module allows to accelerate the development of your node server application with Docker.

Grunt-dockapp is based on the module [Dockerode](https://github.com/apocas/dockerode), but your application should be easily isolated from it by this Grunt module.

Grunt plugin
------------

Using docker as a grunt plugin will give you benefit of deploying your application during development. This actually gives you opportunity to test the application in full isolation of your local machine. One benefit of this is you can simply manages multiple applications under you own machine and use you local browsers for testing. This is very important during development of cookie-based applications. If you need to test two or more such application at the same time on the same machine, you cannot simply use different ports, since browser would not distinguish between them. Docker is very powerful tool allowing to instantinuosly deploy your application under fresh server and run the application straight away on different IP address.

Usage:
```bash
grunt dockapp:name:clean
```

Installation
------------

```bash
npm install --save-dev grunt-dock
```

Commands
--------

Grunt-dock supports these commands:

 * **clean** removes previously created containers
 * **run** rebuilds image and starts a new container
 * **restart** simply restarts your container and application
 * **stop** kills running container and removes it
 
Grunt configuration
-------------------

Here is an example Grunt configuration:

```javascript
dockapp: {
  options: {
    name: 'myDockappImage',
    image: 'ubuntu',
    command: ['node', 'server/app.js' ],
    ports: [ '27017/tcp' ],               // Export also mongodb port
    env: {
      mongodb: '172.17.0.1:27017'         // Use hosts database settings in application
    },
    buildDir: __dirname + '/build',
    portBind: {
      '443/tcp': '8443'
    }
  }
} // dockapp
```

Supported options:
 * **name** New image name. _dockapp_ will always create new image with this name. Give a unique name or leave this option empty (default image will be `dockapp:default`)
 * **image** Name of base image or path to directory containing Dockerfile. Default is `./docker`
 * **command** Array with command and arguments passed. This should be a command which will start your server. Default is `[ 'node', 'app.js' ]`
 * **ports** Array of ports to expose from the container. _dockapp_ normally always expose ports `80/tcp` and `443/tcp`, so you do not need to provide this option. If you want to expose extra ports (e. g. mongodb database port), you can do this here
 * **env** JSON object defining extra environment variable for the process
 * **buildDir** Host directory you want to bind into docker filesystem. Directory will be bound to `/root` path inside docker.
 * **portBind** Port binding for your local filesystem. By default no ports will be used, so you only can access your application using docker container's IP (172.17.0.X:80 or 172.17.0.X:443). If for some reason you want to link your container's ports to your local host, you can define mapping in this option.

Contributing
------------

Pull requests are welcome.

License
-------

The MIT License (MIT)

Copyright (c) 2015 Grzegorz Sikorski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
