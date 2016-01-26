'use strict';

module.exports = function (grunt) {

    require('es6-promise').polyfill();
    var path = require('path');
    var denodeify = require('denodeify');
    var tar = require('tar-fs');
    var Docker = require('dockerode');
    var docker = new Docker(this.docker || {socketPath: '/var/run/docker.sock'});

    var config = {
        name: 'dockapp:default',
        image: './docker',
        ports: [],
        env: {},
        portBind: {},
        buildDir: 'build',
        command: [
            'node', 'app.js'
        ]
    };

    var createImage = function createImage() {
        grunt.log.ok('Creating docker image ' + config.name);
        if (!config.image) {
            grunt.fail.fatal('Option `image` must be defined');
        } else if(grunt.file.isDir(config.image) &&
                  grunt.file.exists(config.image + '/Dockerfile')) {
            // Create new image from Docker file
            return new Promise(function (resolve, reject) {
                    var tarStream = tar.pack(config.image);
                    docker.buildImage(tarStream, {
                            t: config.name
                        }, function (error, output) {
                            if (error) {
                                reject(error);
                            } else {
                                output.on('data', function (chunk) {
                                    try {
                                        var json = JSON.parse(chunk);
                                        json.stream && grunt.log.write(json.stream);
                                        json.error && grunt.log.error(json.error.trim());
                                    } catch (err) {
                                        grunt.log.error(err);
                                        grunt.log.error(chunk);
                                    }
                                });

                                output.on('error', reject);
                                output.on('end', resolve);
                            }
                        });
                });
        } else {
            // Create new image from known image
            return new Promise(function (resolve, reject) {
                    docker.createImage({
                            fromImage: config.image,
                            tag: config.name
                        }, function (error, output) {
                            if (error) {
                                reject(error);
                            } else {
                                output.on('data', function (chunk) {
                                    try {
                                        var json = JSON.parse(chunk);
                                        json.status && grunt.log.write(json.status);
                                        json.error && grunt.log.error(json.error.trim());
                                    } catch (err) {
                                        grunt.log.error(err);
                                        grunt.log.error(chunk);
                                    }
                                });

                                output.on('error', reject);
                                output.on('end', resolve);
                            }
                        });
                });
        }
    };

    var removeContainer = function removeContainer() {
        grunt.log.ok('Removing old containers');
        return denodeify(docker.listContainers.bind(docker))()
        .then(function (containers) {
            return Promise.all(containers.filter(function (container) {
                    return container.Image === config.name;
                }).map(function (found) {
                    grunt.verbose.ok('Found ' + found.Id + ', removing...');
                    var container = docker.getContainer(found.Id);
                    return denodeify(container.remove.bind(container))({ force: true });
                }));
        });
    };

    var createContainer = function createContainer() {
        grunt.log.ok('Creating docker container');
        config.ports = config.ports || [];
        var ports = config.ports.reduce(function (obj, port) {
                obj[port] = {};
                return obj;
            }, {
                // Always expose default HTTP and HTTPS ports
                '443/tcp': {},
                '80/tcp': {}
            });
        var opts = {
            Image: config.name,
            ExposedPorts: ports,
            Cmd: config.command
        };
        var env = [];
        for (var key in config.env) {
            if (config.env.hasOwnProperty(key)) {
                env.push(key + '=' + config.env[key]);
            }
        }
        if (env.length) {
            opts.Env = env;
        }
        return denodeify(docker.createContainer.bind(docker))(opts);
    };

    var attachContainer = function attachContainer(container) {
        grunt.log.ok('Attaching container ' + container.id + ' output');
        return denodeify(container.attach.bind(container))({
                stream: true,
                stdout: true,
                stderr: true,
            })
            .then(function (stream) {
                container.modem.demuxStream(stream, process.stdout, process.stderr);
                return container;
            });
    };

    var startContainer = function startContainer(container) {
        grunt.log.ok('Starting container ' + container.id);
        var opts = {
            PortBindings: {}
        };
        for (var key in config.portBind) {
            if (config.portBind.hasOwnProperty(key)) {
                opts.PortBindings[key] = [
                    {
                        HostPort: config.portBind[key]
                    }
                ];
            }
        }
        if (config.buildDir) {
            opts.Binds = [ config.buildDir + ':/root' ];
        }
        return denodeify(container.start.bind(container))(opts)
            .then(function (data) {
                grunt.log.ok('Container ' + container.id + ' is running.');
                return container;
            });
    };

    grunt.task.registerTask('dockapp', 'Docker container tasks', function () {
        grunt.verbose.ok('Executing dockapp task');
        var options = this.options() || {};
        config.name         = options.name      || config.name;
        config.image        = options.image     || config.image;
        config.ports        = options.ports     || config.ports;
        config.env          = options.env       || config.env;
        config.portBind     = options.portBind  || config.portBind;
        config.buildDir     = options.buildDir;
        config.command      = options.command   || config.command;
        
        var done = this.async();

        var tasks = [
            removeContainer,
            createImage,
            createContainer,
            attachContainer,
            startContainer
        ];

        tasks.reduce(function (prev, next, index) {
                var logIndex = function logIndex(val) {
                    var idx = index + 1;
                    grunt.verbose.ok(idx + '. ' + next.name);
                    return val;
                }
                return prev.then(logIndex).then(next);
            }, Promise.resolve())
            .then(done, done);
    });
};
