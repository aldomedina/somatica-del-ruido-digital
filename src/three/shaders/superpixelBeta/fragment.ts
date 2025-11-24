export const fragmentShader = /*glsl*/ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform sampler2D uPerm;
  uniform float uTileSize;
  uniform vec2 uGrid;
  uniform float uThreshold;
  uniform float uProgress;
  uniform vec2 uTexSize;

  void main(){
    vec2 pixelPos = vUv * uTexSize;
    vec2 cell = floor(pixelPos / uTileSize);
    cell = clamp(cell, vec2(0.0), uGrid - 1.0);

    vec2 local = (pixelPos - cell * uTileSize) / uTileSize;

    vec2 permUV = (cell + 0.5) / uGrid;
    vec4 permVal = texture2D(uPerm, permUV);
    vec2 srcTileUV = permVal.xy;

    vec2 origTileUV = cell / uGrid;

    vec2 center = (uGrid - 1.0) * 0.5;
    float distToCenter = distance(cell, center);
    float maxd = distance(vec2(0.0), center);
    float normDist = distToCenter / maxd;

    // normDist: 0 at center, 1 at edges
    // threshold: 0 = show nothing, 1 = show all
    // Show tile if normDist < threshold (closer tiles shown first)
    bool isActive = normDist < uThreshold;

    // If not active, make transparent
    if (!isActive) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    vec2 targetSrcTile = srcTileUV;

    vec2 srcUV_orig = (origTileUV + local / uGrid);
    vec2 srcUV_mapped = (targetSrcTile + local / uGrid);

    vec2 finalUV = mix(srcUV_orig, srcUV_mapped, uProgress);

    vec4 color = texture2D(uImage, finalUV);

    gl_FragColor = color;
  }
`;
