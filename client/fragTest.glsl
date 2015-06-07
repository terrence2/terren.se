precision highp float;
uniform float t;
varying vec2 uv;

void main() {
    gl_FragColor = vec4(0.5*(uv+1.0), 0.5*(cos(t)+1.0), 1.0);
    //gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
}