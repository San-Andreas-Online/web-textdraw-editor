# GTA SA Sprites

Drop sprite PNG files here following this folder structure:

```
sprites/
├── ld_beat/
│   ├── arrow.png
│   ├── back.png
│   ├── fwd.png
│   ├── no.png
│   └── yes.png
├── ld_card/
│   ├── cd1.png
│   └── ...
├── hud/
├── radar/
├── sampcac/
└── ... (one folder per library)
```

The filename is the texture name, the folder is the library name.
This matches the `lib:tex` format used in SA-MP TextDrawSetString for sprite draws.

The app will automatically resolve `/src/resources/sprites/<lib>/<tex>.png`
via `spriteImagePath()` in `constants/sprites.js`.

If a file is missing the canvas will show the `lib:tex` label as a fallback.
