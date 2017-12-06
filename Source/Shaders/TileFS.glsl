precision mediump float;

// our texture
uniform sampler2D u_image;
uniform sampler2D u_lut;
uniform sampler2D u_lut2;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
    float step = 1.0/1024.0;
    float a1 = texture2D(u_image, v_texCoord).r;
    float a2 = texture2D(u_image, v_texCoord + vec2(step, 0.0)).r;
    float a3 = texture2D(u_image, v_texCoord + vec2(0.0, step)).r;
    float a4 = texture2D(u_image, v_texCoord + vec2(step, step)).r;


    if ((a1 != 0.0 && (a2 == 0.0 || a3 == 0.0 || a4 == 0.0)) || a1 == 0.0) {
    } else {
      vec2 f = fract(v_texCoord * vec2(1024.0, 1024.0));
      float tA = mix(a1, a2, f.x);
      float tB = mix(a3, a4, f.x);
      a1 = mix(tA, tB, f.y);
    }

    float b1 = texture2D(u_image, v_texCoord).g;
    float b2 = texture2D(u_image, v_texCoord + vec2(step, 0.0)).g;
    float b3 = texture2D(u_image, v_texCoord + vec2(0.0, step)).g;
    float b4 = texture2D(u_image, v_texCoord + vec2(step, step)).g;

    if ((b1 != 0.0 && (b2 == 0.0 || b3 == 0.0 || b4 == 0.0)) || b1 == 0.0) {
    } else {
      vec2 f = fract(v_texCoord * vec2(1024.0, 1024.0));
      float tA = mix(b1, b2, f.x);
      float tB = mix(b3, b4, f.x);
      b1 = mix(tA, tB, f.y);
    }

    vec4 pixColor = texture2D(u_lut, vec2(0.0, a1));
    if (b1 >= 0.0117 && b1 <= 0.0156) {
        pixColor = texture2D(u_lut2, vec2(0.0, a1));
    }

    gl_FragColor = pixColor;
}
