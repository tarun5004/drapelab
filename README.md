# DrapeLab

Local fashion studio homepage and interactive product preview. It uses HTML, CSS and native JavaScript modules with no build dependencies.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8000 from the same machine.

- `dist/features/navigation` controls menus.
- `dist/features/gallery` controls comparisons, angles and reference galleries.
- `dist/features/studio` controls tools, browser-local file previews and sample downloads.
- `dist/shared` contains styling and the module entry point.
- The Studio has no live generation, accounts or payments. Uploaded photos stay in memory in the browser. Each downloadable image is a prepared example.
- The example imagery comes from Modelfy and was reused with the owner's direction for this local prototype. Establish its redistribution terms before publishing a public repository. The font licenses are bundled under `dist/assets/fonts`.
