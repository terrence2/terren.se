// This Source Code Form is subject to the terms of the GNU General Public
// License, version 3. If a copy of the GPL was not distributed with this file,
// You can obtain one at https://www.gnu.org/licenses/gpl.txt.
var bunny = require('bunny');
var glslify = require('glslify');
var glNow = require('gl-now');
var mat4 = require('gl-mat4');
var vec3 = require('gl-vec3');
var glBuffer = require('gl-buffer');
var glGeometry = require('gl-geometry');
var glShader = require('gl-shader');
var icosphere = require('icosphere');
var normals = require('normals');
var perspectiveCamera = require('perspective-camera');
var R = require('ramda');

const VertTestShader = glslify(__dirname + '/modelViewPerspective.vert');
const FragTestShader = glslify(__dirname + '/normals.frag');

function main() {
    console.log("Connected to " + window.location);

    // Request metadata.
    const metadataURL = window.location.protocol + "//" + window.location.host + "/metadata.json"
    console.log("Requesting metadata from " + metadataURL);
    const req = new XMLHttpRequest();
    req.open('GET', metadataURL);
    req.onreadystatechange = function(e) {
        if (e.currentTarget.readyState != 4)
            return;
        var metadata = JSON.parse(e.currentTarget.responseText);

        // If debugging, request a side-channel for reloads, etc.
        if (metadata.devmode) {
            const wsURL = "ws://" + window.location.hostname + ":3031";
            console.log("Requesting side-channel at: " + wsURL);
            const webSock = new WebSocket(wsURL);
            webSock.onclose = function(e) {
                console.log("Got close!");
                window.location.reload();
            }
        }
    };
    req.send();
}
window.onload = main;

var shader, buffer, geometry;

const shell = glNow({clearColor:[0,0,0,1]});

const camera = perspectiveCamera({
    fov: Math.PI / 4,
    near: 0.2,
    far: 10000
});

const lightDirection = vec3.create();
lightDirection[0] = 1.0;
lightDirection[1] = 0.0;
lightDirection[2] = 0.0;
vec3.normalize(lightDirection, lightDirection);


// Represents a planet.
var Planet = function(gl) {
    this.rotation = 0;
    this.rotationDirection = 1;
    this.radius = 6378000;
    this.scale = vec3.create();
    this.model = mat4.create();

    this.scale[0] = this.scale[1] = this.scale[2] = 1.0;

    this.shader = glShader(gl, VertTestShader, FragTestShader);

    const mesh = icosphere(4);
    const meshNormals = normals.vertexNormals(
        mesh.cells,
        mesh.positions
    );
    this.geometry = glGeometry(gl)
        .attr('aPosition', mesh.positions)
        .attr('aNormal', meshNormals)
        .faces(mesh.cells);
};
Planet.prototype.think = function(dt) {
    this.rotation += (2 * Math.PI) / (24 * 60 * 60) * (dt / 1000) * this.rotationDirection;
    mat4.identity(this.model);
    mat4.scale(this.model, this.model, this.scale);
    mat4.rotateY(this.model, this.model, this.rotation);
};
Planet.prototype.draw = function(gl, camera, lightDirection) {
    this.geometry.bind(this.shader);
    this.shader.uniforms.uLightDirection = lightDirection;
    this.shader.uniforms.uProjection = camera.projection;
    this.shader.uniforms.uView = camera.view;
    this.shader.uniforms.uModel = this.model;
    this.shader.uniforms.uTime = (Date.now() - initialTime) / 1000;
    this.geometry.draw(gl.TRIANGLES);
};


var Orbiter = function(gl, target, altitude) {
    this.orbitTarget = target;
    this.orbitRadius = target.radius + altitude;
};
Orbiter.prototype.controlCamera = function(camera) {
    camera.identity();
    camera.translate([ 0, 0, 5 ]);
    camera.lookAt([ 0, 0, 0 ]);
    camera.viewport = [ 0, 0, shell.canvas.width, shell.canvas.height ];
    camera.update();
};
Orbiter.prototype.think = function(dt) {
};
Orbiter.prototype.draw = function(gl, camera, lightDirection) {
};


var entities = {};

shell.on('gl-init', function() {
    const gl = shell.gl;

    entities.planet = new Planet(gl);
    entities.orbiter = new Orbiter(gl, entities.planet, 200);

    /*
    const bunnyNormals = normals.vertexNormals(
        bunny.cells,
        bunny.positions
    );
    geometry = glGeometry(gl)
        .attr('aPosition', bunny.positions)
        .attr('aNormal', bunnyNormals)
        .faces(bunny.cells);
    */
});

const initialTime = Date.now();
shell.on("gl-render", function(dt) {

    const gl = shell.gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    var orbitRadius = 1.1;
    var orbitalPosition = 0; // radians
    /*
    var x = Math.cos(rotation) * radius;
    var z = Math.sin(rotation) * radius;
    */
    entities.orbiter.controlCamera(camera);

    R.values(entities).forEach(function(ent){ent.think(dt)});
    R.values(entities).forEach(function(ent){ent.draw(gl, camera, lightDirection)});
});

shell.on("gl-error", function(e) {
    throw new Error("WebGL not supported :(")
});

shell.on("gl-resize", function(width, height) {
});
