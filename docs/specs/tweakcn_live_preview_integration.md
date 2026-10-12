# Directive: Integrate TweakCN Live Preview Script for Vite

## Objective

Add the official TweakCN live-preview script into the `index.html` entry file of this Vite project so that theme modifications can be previewed in real-time from the TweakCN editor.

## File Target

* File: `index.html` (Vite Root Directory)

## Instructions for Antigravity IDE

1. Open the project's root `index.html`.
2. Add the `<script>` tag inside the `<head>` section as shown below:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>

    <!-- TweakCN Live Preview Integration -->
    <script
      crossOrigin="anonymous"
      src="https://tweakcn.com/live-preview.min.js"
    ></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## Verification

* Ensure the script tag is added cleanly within `<head>`.
* Run `npm run dev` (or `pnpm dev` / `yarn dev`) so Vite can serve the updated `index.html` and enable the TweakCN bridge.