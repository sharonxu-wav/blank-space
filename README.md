# 🖐️ Blank Space

A hand-tracked, Iron-Man-inspired holographic OS you control with your webcam — a place to vent, play, and unwind. No mouse, no keyboard: **point, pinch, swipe, and fist.**

**▸ Live:** https://sharonxu-wav.github.io/blank-space/
**▸ Breakdown:** https://sharonxu-wav.github.io/blank-space/breakdown.html

Built with React + Vite, React-Three-Fiber, MediaPipe Hands, and Tone.js. One webcam, two-hand tracking, six hands-free apps:

| App | Gesture |
|-----|---------|
| 🎵 Music | pinch-spin the carousel · point to play/pause |
| 🤖 Interactive 3D | move your hand |
| 🎛️ Gesture FX | CDJ-style two-handed audio FX (filter · echo · delay · reverb · flanger · roll) |
| 🎹 Chord Lab | aim two wheels · pinch to play a piano chord |
| 😂 Meme of the Day | point & hold for the next meme |
| 🎨 Air Canvas | *coming soon* — air-doodle physics sandbox |

## Run it yourself

```bash
git clone https://github.com/sharonxu-wav/blank-space.git
cd blank-space
npm install
npm run dev      # open the printed localhost URL, allow camera
```

Needs **Chrome or Edge** + a webcam. Build for production with `npm run build` (output in `dist/`).

Tip: add `?windows` to the URL for a draggable floating-window menu instead of the carousel.

---
DJ **sharonxu** · build-reel #6 · made with Claude Code
