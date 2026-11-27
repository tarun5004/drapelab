# DrapeLab

Local fashion studio homepage and interactive product preview. It uses HTML, CSS and native JavaScript modules with no build dependencies.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory frontend
```

Open http://127.0.0.1:8000 from the same machine.

- `frontend/features/navigation` controls menus.
- `frontend/features/gallery` controls comparisons, angles and reference galleries.
- `frontend/features/library` controls sample-library search and categories.
- `frontend/features/studio` controls tools, browser-local file previews and sample downloads.
- `frontend/shared` contains styling and the module entry point.
- The Studio has no live generation, accounts or payments. Uploaded photos stay in memory in the browser. Each downloadable image is a prepared example.
- The example imagery comes from Modelfy and was reused with the owner's direction for this local prototype. The repository’s MIT license covers DrapeLab code. Modelfy example imagery and bundled fonts have separate terms. The font licenses are bundled under `frontend/assets/fonts`.
