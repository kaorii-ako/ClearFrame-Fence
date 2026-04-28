# 🪟 Liquid Glass Fences

A beautiful, frosted-glass desktop icon organizer inspired by Stardock Fences — built with Electron. Fences float transparently over your wallpaper with a warm liquid glass aesthetic.

![Liquid Glass Fences](https://i.imgur.com/placeholder.png)

---

## ✨ Features

- **Liquid glass panels** — backdrop blur + frosted glass tinted to match any wallpaper
- **Draggable & resizable** — move and resize fences freely
- **Click-through background** — mouse clicks pass through the empty desktop
- **Persistent** — fence positions and icons saved between sessions
- **Fully customizable:**
  - 5 glass tint themes (Warm, Cool, Neutral, Rose, Sage)
  - Adjustable blur strength, opacity, and corner radius
  - Add/rename/delete fences
  - Add icons from 60+ emoji or paste your own
- **macOS & Windows** support

---

## 🚀 Quick Start

### Requirements
- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/liquid-glass-fences.git
cd liquid-glass-fences

# 2. Install dependencies
npm install

# 3. Launch
npm start
```

The app will launch as a transparent overlay covering your full desktop.

---

## 🎨 Customization

Click the **⚙ gear button** (bottom-right corner) to open settings:

| Setting | Description |
|---|---|
| **Glass Tint** | Color theme for the glass panels |
| **Blur Strength** | How frosted the glass appears (8–60px) |
| **Glass Opacity** | Transparency level of the panels |
| **Corner Radius** | How rounded the panel corners are |

### Tint Themes

| Theme | Best for |
|---|---|
| **Warm** | Orange / coral / sunset wallpapers |
| **Cool** | Blue / purple / night wallpapers |
| **Neutral** | Any wallpaper — pure white glass |
| **Rose** | Pink / magenta wallpapers |
| **Sage** | Green / nature wallpapers |

---

## 🖥️ Usage

### Managing Fences
- **Drag** — click and drag the fence header to move it
- **Resize** — drag the bottom-right corner handle
- **Right-click** a fence for: Rename, Add Icon, Clear Icons, Delete

### Managing Icons
- Click the **＋ Add** cell inside any fence to open the icon picker
- Choose from the emoji palette or paste any emoji
- Type a custom label for the icon
- Hover an icon and click the **✕** to remove it

### Keyboard & Mouse
- Mouse clicks on empty areas **pass through** to your desktop/apps underneath
- Move your mouse onto a fence to interact with it

---

## 📦 Build a distributable

```bash
# macOS (.dmg)
npm run build:mac

# Windows (.exe installer)
npm run build:win

# Both
npm run build
```

Outputs appear in the `dist/` folder.

---

## 🗂️ Project Structure

```
liquid-glass-fences/
├── main.js          # Electron main process (window, IPC, storage)
├── preload.js       # Secure bridge between main & renderer
├── src/
│   ├── index.html   # App shell + modals
│   ├── style.css    # All styles + tint themes
│   └── renderer.js  # UI logic, drag/resize, persistence
├── package.json
└── README.md
```

---

## 🛠️ macOS Notes

On macOS, to make the fences truly sit on the desktop layer (below all app windows), you can enable the following in `main.js`:

```js
// In createWindow(), after mainWindow is created:
mainWindow.setWindowLevel(-1); // sits behind all windows
```

Or for always-on-top behavior:
```js
mainWindow.setAlwaysOnTop(true, 'desktop');
```

---

## 🪪 License

MIT — do whatever you want with it.
