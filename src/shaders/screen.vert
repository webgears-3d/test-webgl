#version 300 es

precision highp float;
precision highp int;

layout(location = 0) in float position;

out vec2 vUv;

void main()
{
    vUv = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);

    gl_Position = vec4(vUv * 2. - 1., 0., 1.);
}
