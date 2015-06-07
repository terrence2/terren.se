precision mediump float;

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: cnoise3 = require(glsl-noise/classic/3d)

// Sets the color of the current fragment (pixel)
// to display the normal at the current position.
// Using `abs()` to prevent negative values, which
// would just end up being black.

varying vec3 vPosition;
varying vec3 vNormal;

uniform vec3 uLightDirection;
uniform float uTime;

uniform mat4 uModel;
uniform mat4 uView;

/*
float
TerrainHeightAt(vec3 pos)
{
    return snoise3(vPosition * vec3(5, 5, 5)) + cnoise3(vPosition * vec3(3, 3, 3));
}

void
main()
{
    //gl_FragColor = vec4(abs(vNormal), 1.0);

    //float height = (1.0 + TerrainHeightAt(vPosition)) / 2.0;

    vec3 surfaceToLight = -uLightDirection;
    vec3 surfaceNormalInCamera = (uView * uModel * vec4(vNormal, 1.0)).xyx;
    float lightness = dot(surfaceNormalInCamera, surfaceToLight);

    const float WaterLevel = 0.0;
    if (TerrainHeightAt(vPosition) < WaterLevel) {
        gl_FragColor = vec4(0, 0, lightness, 1);
    } else {
        // Determine the slope about this point.
        gl_FragColor = vec4(vec3(0, lightness * TerrainHeightAt(vPosition) - WaterLevel, 0), 1);
    }

    //float n = snoise3(vPosition * vec3(20, 20, 20));
    //vec3 norm = vNormal * n;
    //gl_FragColor = vec4(n, n, n, 1.0);
}
*/

float
make_noise(float scale, float power, vec3 pos, vec3 off)
{
    return power * snoise3((vPosition * vec3(scale, scale, scale)) + off);
}

void main() {
    float sparkle = 0.0;

    //sparkle += make_noise(1.0, 0.05, vPosition, vec3(uTime / 90.0, 0, -uTime / 100.0));
    sparkle += make_noise(10.0, 1.02, vPosition, vec3(0,0,0));//vec3(uTime / 50.0 , uTime / 100.0, uTime / 50.0));
    //sparkle += make_noise(100.0, 0.15, vPosition, vec3(uTime * 0.0 , uTime * 0.0, uTime * 1.0));
    //sparkle += make_noise(1000.0, 0.05, vPosition, vec3(uTime * 0.0 , uTime * 0.0, uTime * 0.25));

    /*
    scale = 0.1; power = 0.1; sparkle += power * snoise3(vPosition * vec3(scale, scale, scale));
    scale = 10.0; power = 0.2; sparkle += power * snoise3(vPosition * vec3(scale, scale, scale));
    scale = 100.0; power = 0.3; sparkle += power * snoise3(vPosition * vec3(scale, scale, scale));
    */

    gl_FragColor = vec4(sparkle, sparkle, sparkle, 1);
}