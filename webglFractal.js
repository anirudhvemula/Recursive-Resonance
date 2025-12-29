const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

let audioEnergy = 0;
let audioPeak = 0;


if (!gl) {
  alert("WebGL not supported");
  throw new Error("WebGL not supported");
}

// ---------- Resize ----------
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.floor(window.innerWidth  * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resize);
resize();

// ---------- Shaders ----------
const vertexSrc = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const fragmentSrc = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scale;
uniform vec2 u_center;

uniform float u_audioEnergy;
uniform float u_audioPeak;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec2 c = u_center + uv * u_scale;

  vec2 z = vec2(0.0);
  float iter = 0.0;
  const float MAX_ITER = 300.0;

  for (float i = 0.0; i < MAX_ITER; i++) {
    z = vec2(
      z.x * z.x - z.y * z.y,
      2.0 * z.x * z.y
    ) + c;

    if (dot(z, z) > 4.0) {
      iter = i;
      break;
    }
  }

  if (iter == 0.0) {
  gl_FragColor = vec4(0.02, 0.02, 0.03, 1.0);
  return;
  }


  // Smooth normalized escape
    float log_zn = log(dot(z, z)) / 2.0;
    float nu = log(log_zn / log(2.0)) / log(2.0);
    float smoothIter = iter + 1.0 - nu;

    float norm = smoothIter / MAX_ITER;


  float angle = atan(uv.y, uv.x);
  
  float hue = mod(
  norm * 360.0 +
  angle * 40.0 +
  u_time * 20.0 +
  u_audioEnergy * 120.0,
  360.0
) / 360.0;


  float brightness = clamp(
  0.85 - u_audioPeak * 0.25,
  0.6,
  0.85
  );


  vec3 color = hsv2rgb(vec3(hue, 0.85, brightness));
  
  //color *= 0.75; //dim color as needed

  // filmic gamma correction
  color = pow(color, vec3(1.2));


  gl_FragColor = vec4(color, 1.0);
}
`;

// ---------- Compile ----------
function compile(type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    throw new Error("Shader compile failed");
  }
  return shader;
}

const vs = compile(gl.VERTEX_SHADER, vertexSrc);
const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);

// ---------- Program ----------
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error(gl.getProgramInfoLog(program));
  throw new Error("Program link failed");
}

gl.useProgram(program);

// ---------- Geometry (fullscreen quad) ----------
const quad = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
   1,  1
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

const posLoc = gl.getAttribLocation(program, "a_pos");
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// ---------- Uniforms ----------
const uResolution = gl.getUniformLocation(program, "u_resolution");
const uTime       = gl.getUniformLocation(program, "u_time");
const uScale      = gl.getUniformLocation(program, "u_scale");
const uCenter     = gl.getUniformLocation(program, "u_center");


const uAudioEnergy = gl.getUniformLocation(program, "u_audioEnergy");
const uAudioPeak   = gl.getUniformLocation(program, "u_audioPeak");



// ---------- Animation ----------
let start = performance.now();

function render(now) {
  const t = (now - start) / 1000;

  // Gentle animated zoom & drift
  const baseScale = 2.5;
  const zoom = 0.75 + 0.25 * Math.sin(t * 0.15);
  const scale = baseScale * zoom;

  const centerX = -0.5 + Math.sin(t * 0.17) * 0.25;
  const centerY = Math.cos(t * 0.13) * 0.18;

  gl.uniform2f(uResolution, canvas.width, canvas.height);
  gl.uniform1f(uTime, t);
  gl.uniform1f(uScale, scale);
  gl.uniform2f(uCenter, centerX, centerY);

  gl.uniform1f(uAudioEnergy, audioEnergy);
  gl.uniform1f(uAudioPeak, audioPeak);


  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

export function setAudioMetrics(energy, peak) {
  audioEnergy = energy;
  audioPeak = peak;
}
