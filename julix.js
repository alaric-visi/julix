/* === Canvas bootstrap === */
const canvas = document.getElementById("fractal");
const ctx    = canvas.getContext("2d");

let width, height, imageData, pixels;
let running    = true;
let needRender = true;

function resize() {
const dpr = window.devicePixelRatio || 1;
width  = canvas.width  = Math.floor(window.innerWidth  * dpr);
height = canvas.height = Math.floor(window.innerHeight * dpr);
ctx.imageSmoothingEnabled = false;
imageData = ctx.createImageData(width, height);
pixels    = imageData.data;
needRender = true;
}
window.addEventListener("resize", resize);
resize();

/* === Colour palettes === */
const rgb = (r, g, b) => [r | 0, g | 0, b | 0];
const palettes = [
t => rgb(  9*(1-t)*t**3*255, 15*(1-t)**2*t*t*255,  8.5*(1-t)**3*t*255 ),
t => rgb(255*t,              255*Math.sqrt(t)*(1-t),  64*(1-t)        ),
t => rgb(127.5*(1+Math.sin(6*t    )),
        127.5*(1+Math.sin(6*t+2)),
        127.5*(1+Math.sin(6*t+4))),
t => rgb( 20*(1-t),  80+120*t, 200+55*t ),
t => rgb(255*t,      255*t,    255*t   ),
t => rgb(100*(1-t),  200*t,    255*Math.min(1,1.2*t))
];

/* === Application state === */
const state = {
center_x : -0.1,
center_y :  0.0,
scale    :  1.5,
max_iter : 30,
palette  :  4,
set      : "Julia",
c_re     : -0.5251993,
c_im     : -0.5251993,
frame    :  0
};

/* === Main render === */
function renderFractal() {
const aspect = width / height;
const view_w = 3.5 / state.scale;
const view_h = view_w / aspect;
const left   = state.center_x - view_w / 2;
const top    = state.center_y - view_h / 2;

for (let py = 0, idx = 0; py < height; py++) {
 const cy = top + py * view_h / height;
 for (let px = 0; px < width; px++, idx += 4) {
   const cx = left + px * view_w / width;

   let zx, zy, cx0, cy0;
   if (state.set === "Mandelbrot") {
     zx = zy = 0; cx0 = cx; cy0 = cy;
   } else {
     zx = cx; zy = cy; cx0 = state.c_re; cy0 = state.c_im;
   }

   let i = 0;
   while (zx * zx + zy * zy <= 4 && i < state.max_iter) {
     const tmp = zx * zx - zy * zy + cx0;
     zy = 2 * zx * zy + cy0;
     zx = tmp;
     i++;
   }

   let r = 0, g = 0, b = 0;
   if (i !== state.max_iter) {
     const t = i / state.max_iter;
     [r, g, b] = palettes[state.palette](t);
   }
   pixels[idx]     = r;
   pixels[idx + 1] = g;
   pixels[idx + 2] = b;
   pixels[idx + 3] = 255;
 }
}
ctx.putImageData(imageData, 0, 0);
needRender = false;
}

/* === Animation loop with FPS throttle === */
let lastRender = 0;
const FPS           = 30;
const FRAME_INTERVAL = 1000 / FPS;

function animate(ts) {
if (!running) return;

// update animated Julia constant every frame
state.frame++;
const t = state.frame * 0.02;
state.c_re = 0.7885 * Math.cos(t);
state.c_im = 0.7885 * Math.sin(t);
needRender = true;

// throttle to target FPS
if (ts - lastRender >= FRAME_INTERVAL && needRender) {
 renderFractal();
 lastRender = ts;
}

requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

/* === UI === */
const iterSlider    = document.getElementById("iterSlider");
const paletteSelect = document.getElementById("paletteSelect");

// populate palette dropdown
["Default","Fire","Rainbow","Ocean","Grayscale","Electric"]
.forEach((name, i) => {
 const opt = document.createElement("option");
 opt.value = i;
 opt.textContent = name;
 paletteSelect.appendChild(opt);
});

function updateUI() {
iterSlider.value    = state.max_iter;
paletteSelect.value = state.palette;
}
updateUI();

/* === Control actions === */
document.getElementById("zoomIn") .addEventListener("click", () => { state.scale *= 1.1;  needRender = true; });
document.getElementById("zoomOut").addEventListener("click", () => { state.scale /= 1.1;  needRender = true; });

function pan(dx, dy) {
const step = 0.1 / state.scale;
state.center_x += dx * step;
state.center_y += dy * step;
needRender = true;
}
document.getElementById("panUp")   .addEventListener("click", () => pan(0, -1));
document.getElementById("panDown") .addEventListener("click", () => pan(0,  1));
document.getElementById("panLeft") .addEventListener("click", () => pan(-1, 0));
document.getElementById("panRight").addEventListener("click", () => pan( 1, 0));

iterSlider.addEventListener("input", e => {
state.max_iter = +e.target.value;
needRender = true;
});
paletteSelect.addEventListener("change", e => {
state.palette = +e.target.value;
needRender = true;
});
