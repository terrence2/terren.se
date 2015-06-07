#!/usr/bin/env node
// This Source Code Form is subject to the terms of the GNU General Public
// License, version 3. If a copy of the GPL was not distributed with this file,
// You can obtain one at https://www.gnu.org/licenses/gpl.txt.
var bunyan = require('bunyan');
var fs = require('fs');
var http = require('http');
var router = require('./router.js');
var ws = require('nodejs-websocket');
var argv = require('yargs').argv;

if (argv.h || argv.help) {
    console.log("Usage server.js [OPTS]");
    console.log("  This program serves the dist/[build]/bundle.html file.");
    console.log("");
    console.log("  --address HOST     The interface to listen for http on (default: localhost).");
    console.log("  --port ID          The port to listen for http on (default: 8081).");
    console.log("  --devmode          Enables the websocket server to trigger auto-refresh.");
    console.log("  --ws-address HOST  The interface to listen for ws on (default: localhost).");
    console.log("  --ws-port ID       The port to listen for ws on (default: 3031).");
    process.exit(0);
}
const HTTP_ADDRESS = argv.address || 'localhost';
const HTTP_PORT = argv.port || 8081;
const WS_ADDRESS = argv.ws_address || 'localhost';
const WS_PORT = argv.ws_port || 3031;

const MODE = argv.devmode ? 'debug' : 'release';

const ROUTES = {
    '/':           new router.StaticFile('resources/index.html'),
    '/index.html': new router.StaticFile('resources/index.html'),
    '/terren.js':  new router.StaticFile('build/' + MODE + '/bundle.js'),
    '/metadata.json': new router.JsonBlob({'devmode': argv.devmode, 'ws_port': WS_PORT})
};

var log = bunyan.createLogger({name: "terren.se"});

http.createServer(function(request, response) {
    log.info("request from " + request.socket.remoteAddress + ":" + request.socket.remotePort + " for " + request.url);
    if (ROUTES[request.url] === undefined) {
        log.warn("No route for: " + request.url);
        response.writeHead(404, {'Content-Type': 'text/html'});
        response.write("<html><head><title>404: file not found</title></head><body>404: file not found</body></html>");
        return;
    }
    ROUTES[request.url].get(request, response);
}).listen(HTTP_PORT, HTTP_ADDRESS, function() {
    log.info("listening for http on " + HTTP_PORT);
});

if (argv.devmode) {
    ws.createServer(function (conn) {
        log.info("new websocket connection from " + conn);
        for (var key in ROUTES) {
            if (ROUTES.hasOwnProperty(key) && ROUTES[key].hasOwnProperty('filename')) {
                var filename = ROUTES[key].filename;
                log.info("watching " + filename);
                fs.watch(filename, {persistent: false, recursive: false}, function (event, filename2) {
                    log.info("Changed " + filename2 + " event is " + event);
                    conn.close();
                });
            }
        }
    }).listen(WS_PORT, WS_ADDRESS, function () {
        log.info("listening for ws on " + WS_PORT);
    });
}
