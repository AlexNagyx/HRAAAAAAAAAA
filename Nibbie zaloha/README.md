Nibbie — Tiny Pixel Pet

This folder contains a small browser-based pixel pet with simple minigames.

Release checklist performed:
- Modal start/close handlers are delegated and robust.
- Minigames stop cleanly when exiting the modal (intervals and key handlers cleared).
- Charge cooldown and HUD pixels implemented.

How to run
1. Open `index.html` in a browser (Chrome/Edge/Firefox recommended).
2. Click `play` to open the minigame selector.
3. Choose a minigame and click `Start`. Use `Exit` to return to the selector.

Notes for packaging
- Ensure `assets/fries.png` and the sprite PNGs referenced in `script.js` are present in the same folder or update paths.
- Consider minifying `script.js` and `bacisc.css` for production.

Contact
If you want additional polish (build script, packaging, icon, or distribution zip), tell me and I can add it.
