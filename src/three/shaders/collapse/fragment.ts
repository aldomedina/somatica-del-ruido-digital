export const fragmentShader = /*glsl*/ `precision mediump float;

uniform sampler2D u_texture;
varying vec2 vUv;
varying float vAlpha;

void main() {
    vec4 c = texture2D(u_texture, vUv);
    gl_FragColor = vec4(c.rgb, c.a * vAlpha);
}
`;
