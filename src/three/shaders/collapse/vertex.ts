export const vertexShader = /*glsl*/ `
attribute vec2 a_quadPos;     // en vez de 'position'
attribute vec2 a_origPos;
attribute vec2 a_targetPos;
attribute vec2 a_uvOffset;
attribute float a_rank;

uniform float u_progress;

varying vec2 vUv;

void main() {
    // expand vec2 → vec3
    vec3 quad = vec3(a_quadPos, 0.0);

    // interpolación entre posiciones
    vec2 pos = mix(a_origPos, a_targetPos, u_progress);

    // construir posición final
    vec3 finalPos = quad + vec3(pos, 0.0);

    vUv = a_uvOffset + a_quadPos * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}

`;
