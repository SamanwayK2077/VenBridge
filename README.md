# VenBridge

**VenBridge** is a translation layer and plugin manager for **Revenge (Vendetta)** that allows you to run **Vencord** plugins and use PC-based CSS themes on the mobile Discord client.

## Features

- **Plugin Selector:** A dedicated interface to enable, disable, and manage Vencord plugins.
- **Vencord API Polyfill:** Provides a `window.Vencord` and `definePlugin` environment that maps Vencord's Desktop API to Revenge's Mobile Metro/Patcher API.
- **Theme Translator:** Automatically converts PC `.css` themes into Revenge-compatible `.json` themes by mapping standard CSS variables to semantic Discord tokens.
- **Dynamic Loading:** Install plugins directly from GitHub raw URLs.

## Project Structure

- `src/index.ts`: The main Revenge plugin entry point.
- `src/manager/`: Core logic for managing Vencord plugin lifecycles and the Settings UI.
- `src/translator/plugin/`: The polyfill layer mapping Webpack/Patcher to Revenge's Metro.
- `src/translator/theme/`: The CSS variable translation engine.

## Building from Source

Ensure you have [Bun](https://bun.sh) installed.

1. **Install Dependencies:**
   ```bash
   bun install
   ```

2. **Build the Bundle:**
   ```bash
   bun run build
   ```
   The compiled plugin will be located in the `dist/` directory.

## Installation in Revenge

1. Build the project or use a pre-built `dist/manifest.json`.
2. Host the `dist/` folder on a web server (e.g., GitHub Pages).
3. In Revenge, go to **Settings > Plugins > Install Plugin**.
4. Paste the URL to your hosted `manifest.json`.

## Usage

Once VenBridge is installed:
1. Open **Settings > VenBridge**.
2. To install a Vencord plugin, paste its `.js` URL into the input field.
3. To translate a theme, paste the `.css` URL into the Theme Translator section.

## Disclaimer

VenBridge is a translation layer. While it supports common Webpack and Patcher APIs, some complex plugins (specifically those using Desktop-only features or low-level string patching) may require manual adjustments.
