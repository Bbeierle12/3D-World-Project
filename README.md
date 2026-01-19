# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Rendering Notes

- WebGPU is the preferred backend; when it is unavailable and fallback is enabled, the renderer will use WebGL.
- The debug HUD exposes renderer info, perf stats, and a ray trace preview toggle.
- Ray trace preview is a CPU raycaster prototype (low-res, pixelated overlay). It is not a full path tracer and is intended for experimentation.

## Hardware Support

- WebGPU requires a compatible browser with WebGPU enabled.
- If WebGPU is not supported and WebGL fallback is disabled, the app will not render.

## Native Builds (Planned)

- A platform adapter lives in `src/platform/index.ts` to keep file IO portable.
- We still need to choose between Tauri or Electron based on tooling and GPU access needs.
