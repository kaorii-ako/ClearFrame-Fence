# Liquid Glass Fences - Release Notes

## v1.0.0 (Initial Release)

### Features
- **Desktop Overlay** - Glass-like fences that float on your desktop
- **System Tray** - Minimize to tray, right-click for menu
  - Show/Hide toggle
  - Always on Top option
  - Quit application
- **Global Hotkey** - Press `Ctrl+Shift+F` to show/hide the app
- **Auto-start** - Automatically launches on system boot (hidden)
- **App Launcher** - Add apps to fences and launch them with one click
  - Scans installed apps automatically
  - Uses native app icons
- **Drag & Resize** - Move and resize fences freely
- **Customizable Glass** - Adjust appearance in settings:
  - Glass Tint (Warm/Cool/Neutral/Rose/Sage)
  - Blur Strength (8-60px)
  - Glass Opacity (5-60%)
  - Corner Radius (8-40px)
- **Taskbar** - Shows in Windows taskbar for easy access

### Project Structure
```
├── main.js                    - Electron main process
├── preload.js                 - IPC bridge
├── src/
│   ├── main/
│   │   ├── tray.js            - System tray handling
│   │   └── shortcuts.js       - Global hotkey registration
│   ├── model/
│   │   ├── fence.js           - Fence data model
│   │   └── manager.js         - Data persistence
│   ├── renderer/
│   │   ├── index.html         - UI
│   │   ├── renderer.js        - UI logic
│   │   └── style.css          - Glass styling
│   └── util/
│       └── apps.js            - App scanner
```

### Installation
- **Windows**: Run `.exe` installer (NSIS)
- **macOS**: Mount `.dmg` and drag to Applications

### System Requirements
- Windows 10+ or macOS 10.14+
- Electron 28+

---
Built with Electron • Open Source • Free forever