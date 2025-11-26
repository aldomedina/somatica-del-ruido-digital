// components/fragmentShader.ts
const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uImage; // source image
  uniform sampler2D uPerm;  // perm texture (gridX x gridY) storing src tile uv in .xy
  uniform float uTileSize;
  uniform vec2 uGrid;       // grid.x = cols, grid.y = rows
  uniform float uThreshold; // 0..1
  uniform float uProgress;  // 0..1
  uniform vec2 uTexSize;    // texture pixel size

  void main(){
    // pixel position in texture pixels
    vec2 pixelPos = vUv * uTexSize;

    // which cell (destination)
    vec2 cell = floor(pixelPos / uTileSize);
    cell = clamp(cell, vec2(0.0), uGrid - vec2(1.0));

    // local coordinate inside the cell (0..1)
    vec2 local = (pixelPos - cell * uTileSize) / uTileSize;

    // lookup perm: sample perm texture at center of cell
    vec2 permUV = (cell + 0.5) / uGrid;
    vec4 permVal = texture2D(uPerm, permUV);
    vec2 srcTileUV = permVal.xy; // origin uv of source tile (0..1 relative to grid)

    // original tile origin uv
    vec2 origTileUV = cell / uGrid;

    // center distance normalization
    vec2 center = (uGrid - vec2(1.0)) * 0.5;
    float distToCenter = distance(cell, center);
    float maxd = distance(vec2(0.0), center);
    float normDist = distToCenter / maxd;

    // decide active based on threshold
    bool isActive = normDist < uThreshold;

    if (!isActive) {
      // transparent / skip
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // compute source UVs inside texture space:
    // srcTileUV is normalized tile origin (0..1 in grid coords), we need to offset by local/uGrid
    vec2 srcUV_orig = (origTileUV + local / uGrid);
    vec2 srcUV_mapped = (srcTileUV + local / uGrid);

float reveal = uProgress;

vec2 mix1 = mix(srcUV_orig, srcUV_mapped, smoothstep(0.0, 0.5, reveal));
vec2 mix2 = mix(srcUV_mapped, vUv,        smoothstep(0.5, 1.0, reveal));

vec2 finalUV = (reveal < 0.5)
  ? mix1
  : mix2;
    vec4 color = texture2D(uImage, finalUV);

    gl_FragColor = color;
  }
`;
export default fragmentShader;
