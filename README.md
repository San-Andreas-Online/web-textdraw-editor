# TextDraw Designer

A web-based visual editor for creating SA-MP and open.mp TextDraws. Design your HUD directly in the browser and export ready-to-paste Pawn code, no server required.

## Why this exists

Most TextDraw editors are either in-game tools that require running a SA-MP server, or basic web tools with limited features. This one runs entirely in the browser, has a proper layer system, supports multiple background images (layers) as a reference, and exports clean Pawn code for both Global and Player TextDraws.


<div align="center">

If you like this project, consider supporting us!

[![PayPal](https://img.shields.io/badge/paypal-One%20Time%20Donation-003087?style=flat&logo=paypal)](https://paypal.me/MichaelAceAnderson)
[![Patreon](https://img.shields.io/badge/patreon-Subscription-FF424D?style=flat&logo=patreon)](https://www.patreon.com/posts/san-andreas-open-153811828)


</div>


---

## Screenshots

### Editor
![Full editor view](_docs/canvas.gif)
The main canvas. Elements can be dragged, resized and selected individually or in a group. The left panel handles adding and organizing elements, the right panel shows properties for whatever is selected.

---
### Sprite Browser

<div align="center">
  <img src="_docs/sprites.png" height="300"/>
</div>
Browse all known GTA SA sprite libraries by name or filter by library.

---

### Pawn Export
![Export modal](_docs/export.png)

The export generates clean, ready-to-paste pawn code.

---

## Getting Started

**Requirements:** Node.js 18 or higher
```bash
git clone https://github.com/San-Andreas-Online/textdraw-designer
cd textdraw-designer
npm install
npm run dev
```

Open `http://localhost:5173` in your browser and editing.

---

## Features

### Canvas & Editing
- Snap-to-grid with configurable grid size
- Drag selection for selecting multiple elements at once
- Resize any element with the corner handle
- Nudge selected elements with arrow keys
- Widescreen mode toggle for 16:9 layouts
  
### Element Types
All standard SA-MP TextDraw types are supported:
- **Label**
- **Button**
- **Box**
- **Sprite**
  
### Layers & Organization
- Layer panel showing all elements in order
- Drag-and-drop layer reordering
- Toggle visibility and lock per element
- Bring to front / send to back
  
### Export & Import
- Export to Pawn code. Global TD (`TextDraw`) or Player TD (`PlayerTextDraw`)
- Import from existing `JSON` projects or `pawn code` textdraws

### Reference Images
- Upload images as a overlay on the canvas
- Drag, resize, and adjust opacity per image
- Lock reference images so they don't get in the way while editing
- Useful for tracing mockups or screenshots
  
---

## Tech Stack
- [Vue 3](https://vuejs.org/) UI framework
- [Vite](https://vitejs.dev/) build tool
- [Pinia](https://pinia.vuejs.org/) state management

---


## License
MIT
