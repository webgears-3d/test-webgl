#version 300 es

precision highp float;
precision highp int;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uTarget;
uniform vec3 uCoords;

in vec2 vUv;

out vec4 fragColor;

const float epsilon = 0.1e-4;
const float PI = 3.141592653589793;
const float RECEIPROCAL_PI = 1.0 / 3.141592653589793;

float dot2(in vec3 v) { return dot(v, v); }

float dot2(in vec2 v) { return dot(v, v); }

vec4 plainIntersect(in vec3 ro, in vec3 rd, in vec4 p)
{
    float t = -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);

    return vec4(t, p.xyz);
}

float cylinder(vec3 p, float r, float h)
{
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(h,r);
    return min(max(d.x,d.y), 0.0) + length(max(d, 0.0));
}

float teeth(vec3 p, vec2 h)
{
    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);

    p = abs(p);

    p.xy -= 2.0 * min(dot(k.xy, p.xy), 0.0) * k.xy;

    vec2 d = vec2(length(p.xy - vec2(clamp(p.x, -k.z * h.x, k.z * h.x), h.x)) * sign(p.y - h.x), p.z-h.y);

    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float opR(in float d, in float rad)
{
    return d - rad;
}


float opU(float d1, float d2, float k)
{
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);

    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float gear(in vec3 pos, in vec3 center, in vec2 tooth, in vec3 body, in float time, in float shift) {
    pos += center;

    vec3 trp = vec3(pos.x, -pos.z, pos.y);

    float d = max(-opR(cylinder(trp, 0.8, body.z), 0.02), opR(cylinder(trp, 0.02, body.x), 0.02));

    float a = 1.6 * time + shift;

    for (int i = 0; i < 16; i++) {
        a += float(i) * PI / 8.0;

        float dcs = cos(a);
        float dsn = sin(a);

        float cs = cos(PI / 2.0 + a);
        float sn = sin(PI / 2.0 + a);

        vec3 tx = pos + vec3(dcs * body.y, -dsn * body.y, 0.0);
        vec3 tr = vec3(cs * tx.x - sn * tx.y, sn * tx.x + cs * tx.y, tx.z);

        d = opU(d, opR(teeth(tr, tooth), 0.01), 0.01);
    }

    return d;
}

vec2 map(in vec3 pos, in float time) {
    // that is what real webgears stand for..., LoL
    float d1 = gear(pos, vec3(0.0), vec2(0.03, 0.015), vec3(0.2, 0.22, 0.14), time, 0.0);
    float d2 = gear(pos, vec3(-0.3, 0.3, 0.0), vec2(0.02, 0.014), vec3(0.14, 0.16, 0.1), -time, 0.17);

    float m = d1 < d2 ? 1.0 : 2.0;

    return vec2(min(d1, d2), m);
}

vec3 calcNormal(in vec3 p, in float time)
{
    const float h = epsilon;
    const vec2 k = vec2(1.0, -1.0);

    return normalize(
        k.xyy * map(p + k.xyy * h, time).x +
        k.yyx * map(p + k.yyx * h, time).x +
        k.yxy * map(p + k.yxy * h, time).x +
        k.xxx * map(p + k.xxx * h, time).x);
}

vec2 raymarch(in vec3 ro, in vec3 rd, in vec2 bounds, in float time) {
    float far = bounds.y;
    float near = bounds.x;
    float d = near;
    float m = 0.0;

    for (int i = 0; i < 64 && d < far; i++) {
        vec3 pos = ro + rd * d;

        vec2 res = map(pos, time);

        float h = res.x;

        m = res.y;

        if (abs(h) < near) break;

        d += h;
    }

    return vec2(d, m);
}

float calcAO(in vec3 pos, in vec3 nor, in float time)
{
    float occ = 0.0;
    float sca = 1.0;

    for(int i = 0; i < 5; i++) {
        float hr = 0.01 + 0.12 * float(i) / 4.0;

        vec3 aopos =  nor * hr + pos;

        float dd = map(aopos, time).x;

        occ += -(dd - hr) * sca;

        sca *= 0.95;
    }

    return clamp(1.0 - 3.0 * occ, 0.0, 1.0) * (0.5 + 0.5 * nor.y);
}

float grid(in vec2 p)
{
    const float N = 40.0; // grid ratio

    vec2 w = max(abs(dFdx(p)), abs(dFdy(p))) + 0.001;

    vec2 a = p + 0.5 * w;
    vec2 b = p - 0.5 * w;

    vec2 i = (floor(a) + min(fract(a) * N, 1.0) - floor(b) - min(fract(b) * N, 1.0)) / (N*w);

    return max(0.6, (1.0 - i.x) * (1.0 - i.y));
}

struct Camera {
    vec3 rayOrigin;
    vec3 rayDirection;
};

void updateCamera(in vec3 coord, in vec3 target, in float aspect, inout Camera camera)
{
    // TASK PART - 1, implement camera controller:
    // ...

    camera.rayOrigin = vec3(0.25, 0.3, -1.0);
    camera.rayDirection = normalize(vec3(-1.0 + 2.0 * vUv, 1.0) * vec3(aspect, 1.0, 1.0));
}

void main() {
    Camera camera;

    updateCamera(uCoords, uTarget, uResolution.x / uResolution.y, camera);

    vec3 ro = camera.rayOrigin;
    vec3 rd = camera.rayDirection;

    vec3 light = vec3(0.57703, 0.57703, -1.0); // point light position
    vec3 color1 = vec3(0.85, 0.85, 0.92);
    vec3 color2 = vec3(0.92, 0.76, 0.74);
    vec3 color3 = vec3(0.4, 0.0, 0.0);

    vec3 outColor = mix(vec3(0.0, 0.509, 0.49), vec3(0.8, 0.94, 1.0), vUv.y);

    float far = 10.0;

    vec2 bounds = vec2(epsilon, far);

    vec2 res = raymarch(ro, rd, bounds, uTime);
    float d = res.x;
    float m = res.y;

    vec3 color = vec3(0.8, 0.7, 0.7);

    vec4 plain = plainIntersect(ro, rd, vec4(0.0, 1.0, 0.0, 0.75));

    // TASK, PART - 2, cast shadows from gears to the plane:
    // ...
    float shadow = 1.0; // compute shadow factor

    if (plain.x > 0.0) {
        vec3 pos = ro + rd * plain.x;
        vec3 norm = vec3(0.0, 1.0, 0.0);
        vec3 l = normalize(light - pos);

        float nl = clamp(dot(norm, l), 0.0, 1.0);

        vec3 direct = vec3(nl) * color * RECEIPROCAL_PI;
        vec3 indirect = color * grid(pos.xz * 4.0);

        outColor = indirect + direct;
    }

    if (d < far && (d < plain.x || plain.x < 0.0) && m < 3.0) {
        color = m < 2.0 ? color1 : color2;

        vec3 pos = ro + rd * d;
        vec3 norm = calcNormal(pos, uTime);

        float ao = calcAO(pos, norm, uTime);

        vec3 l = normalize(light - pos);
        vec3 v = normalize(ro - pos);
        vec3 h = normalize(l + v);

        float nl = clamp(dot(norm, l), 0.0, 1.0);

        vec3 direct = vec3(nl) * color * RECEIPROCAL_PI;
        vec3 indirect = ao * color;

        outColor = indirect + direct;
    }

    outColor *= outColor;

    fragColor = vec4(outColor, 1.0);
}
