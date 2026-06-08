// src/translator/plugin/vencord.ts
import { metro } from "@revenge/metro";
import { ui } from "@revenge/ui";
import { patcher } from "@revenge/patcher";
var VencordPolyfill = {
  Webpack: {
    findByProps: (...props) => metro.findByProps(...props),
    findByDisplayName: (name) => metro.findByName(name),
    findModule: (filter) => metro.find(filter),
    Common: {
      Channels: () => metro.findByProps("getChannel", "hasChannel"),
      Messages: () => metro.findByProps("sendMessage", "editMessage"),
      Users: () => metro.findByProps("getUser", "getCurrentUser"),
      Guilds: () => metro.findByProps("getGuild", "getGuilds"),
      SelectedChannel: () => metro.findByProps("getChannelId", "getVoiceChannelId"),
      UserStore: () => metro.findByProps("getUser", "getCurrentUser"),
      ChannelStore: () => metro.findByProps("getChannel"),
      MessageStore: () => metro.findByProps("getMessage"),
      Dispatcher: () => metro.findByProps("dispatch", "subscribe"),
      Flux: () => metro.findByProps("Store", "connectStores"),
      React: () => metro.findByProps("createElement", "useState"),
      ReactDOM: () => metro.findByProps("render", "findDOMNode")
    }
  },
  Plugins: {
    plugins: {},
    get: (name) => VencordPolyfill.Plugins.plugins[name]
  },
  Utils: {
    copyText: (text) => {
      const { Clipboard } = metro.findByProps("Clipboard");
      Clipboard.setString(text);
      ui.showToast("Copied to clipboard");
    },
    findInTree: (tree, filter) => {
      if (filter(tree))
        return tree;
      if (Array.isArray(tree)) {
        for (const item of tree) {
          const res = VencordPolyfill.Utils.findInTree(item, filter);
          if (res)
            return res;
        }
      } else if (typeof tree === "object" && tree !== null) {
        for (const key in tree) {
          const res = VencordPolyfill.Utils.findInTree(tree[key], filter);
          if (res)
            return res;
        }
      }
      return null;
    }
  },
  Patcher: {
    before: (mod, func, patch) => patcher.before(mod, func, patch),
    after: (mod, func, patch) => patcher.after(mod, func, patch),
    instead: (mod, func, patch) => patcher.instead(mod, func, patch)
  },
  ui: {
    showToast: (msg) => ui.showToast(msg),
    showConfirmationModal: (title, content, onConfirm) => {
      ui.showConfirmationModal({
        title,
        content,
        onConfirm,
        confirmText: "Confirm",
        cancelText: "Cancel"
      });
    }
  }
};
var definePlugin = (plugin) => {
  VencordPolyfill.Plugins.plugins[plugin.name] = plugin;
  return plugin;
};
var initVencordGlobal = () => {
  window.Vencord = VencordPolyfill;
  window.definePlugin = definePlugin;
};

// src/manager/pluginManager.ts
import { storage } from "@revenge/utils";
import { logger as logger2 } from "@revenge/utils";

// src/translator/plugin/patchTranslator.ts
import { metro as metro2 } from "@revenge/metro";
import { logger } from "@revenge/utils";
var MODULE_MAP = {
  "getChannel:": () => metro2.findByProps("getChannel"),
  "sendMessage:": () => metro2.findByProps("sendMessage"),
  "getUser:": () => metro2.findByProps("getUser"),
  "MessageStore:": () => metro2.findByProps("getMessage", "getMessages"),
  "UserStore:": () => metro2.findByProps("getUser", "getCurrentUser")
};
var applyVencordPatches = (pluginName, patches) => {
  if (!patches)
    return;
  patches.forEach((patch, index) => {
    const { find, replacement } = patch;
    const module = MODULE_MAP[find]?.();
    if (module) {
      logger.log(`[VenBridge] Attempting to translate patch ${index} for ${pluginName} (find: ${find})`);
    } else {
      logger.warn(`[VenBridge] Could not find module for patch ${find} in plugin ${pluginName}`);
    }
  });
};

// src/manager/pluginManager.ts
class PluginManager {
  static plugins = [];
  static init() {
    if (!storage.vencordPlugins) {
      storage.vencordPlugins = [];
    }
    this.plugins = storage.vencordPlugins;
    this.startEnabledPlugins();
  }
  static async installPlugin(url) {
    try {
      const response = await fetch(url);
      const code = await response.text();
      const pluginFunc = new Function("definePlugin", "Vencord", code);
      pluginFunc(window.definePlugin, window.Vencord);
      const pluginNames = Object.keys(window.Vencord.Plugins.plugins);
      const pluginName = pluginNames[pluginNames.length - 1];
      const plugin = window.Vencord.Plugins.plugins[pluginName];
      if (plugin) {
        plugin.url = url;
        plugin.enabled = true;
        this.plugins.push(plugin);
        storage.vencordPlugins = this.plugins;
        applyVencordPatches(plugin.name, plugin.patches);
        if (plugin.onStart)
          plugin.onStart();
        logger2.log(`Installed Vencord plugin: ${plugin.name}`);
      }
    } catch (e) {
      logger2.error(`Failed to install plugin from ${url}: ${e}`);
    }
  }
  static startEnabledPlugins() {
    this.plugins.forEach((p) => {
      if (p.enabled && p.onStart) {
        try {
          p.onStart();
        } catch (e) {
          logger2.error(`Error starting plugin ${p.name}: ${e}`);
        }
      }
    });
  }
  static stopPlugin(name) {
    const plugin = this.plugins.find((p) => p.name === name);
    if (plugin && plugin.onStop) {
      plugin.onStop();
      plugin.enabled = false;
    }
  }
}

// src/manager/SettingsPage.tsx
import { React } from "@revenge/metro/common";
import { ui as ui2 } from "@revenge/ui";

// src/translator/theme/cssToRevenge.ts
var MAPPING = {
  "--background-primary": "BACKGROUND_PRIMARY",
  "--background-secondary": "BACKGROUND_SECONDARY",
  "--background-tertiary": "BACKGROUND_TERTIARY",
  "--background-accent": "BACKGROUND_ACCENT",
  "--background-floating": "BACKGROUND_FLOATING",
  "--text-normal": "TEXT_NORMAL",
  "--text-muted": "TEXT_MUTED",
  "--header-primary": "HEADER_PRIMARY",
  "--header-secondary": "HEADER_SECONDARY",
  "--brand-experiment": "BRAND_500",
  "--interactive-normal": "INTERACTIVE_NORMAL",
  "--interactive-hover": "INTERACTIVE_HOVER",
  "--interactive-active": "INTERACTIVE_ACTIVE",
  "--interactive-muted": "INTERACTIVE_MUTED"
};
var translateCssToRevenge = (css) => {
  const semanticColors = {};
  const rawColors = {};
  const varRegex = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\(.*?\))/g;
  let match;
  while ((match = varRegex.exec(css)) !== null) {
    const [_, varName, value] = match;
    if (MAPPING[varName]) {
      const semanticKey = MAPPING[varName];
      semanticColors[semanticKey] = [value, value];
    } else if (varName.startsWith("--brand")) {
      rawColors["BRAND_500"] = value;
    }
  }
  return {
    name: "Imported Vencord Theme",
    description: "Translated from CSS",
    authors: [{ name: "VenBridge Translator", id: "0" }],
    spec: 1,
    semanticColors,
    rawColors
  };
};

// src/manager/SettingsPage.tsx
import { logger as logger3 } from "@revenge/utils";
import { jsxDEV } from "react/jsx-dev-runtime";
var { ScrollView, View, Text, TextInput, Button } = ui2.Components;
var { FormRow, FormSwitch, FormSection, FormInput } = ui2.Components;
var SettingsPage = () => {
  const [pluginUrl, setPluginUrl] = React.useState("");
  const [themeUrl, setThemeUrl] = React.useState("");
  const handleInstallPlugin = async () => {
    if (!pluginUrl)
      return;
    await PluginManager.installPlugin(pluginUrl);
    setPluginUrl("");
  };
  const handleInstallTheme = async () => {
    if (!themeUrl)
      return;
    try {
      const response = await fetch(themeUrl);
      const css = await response.text();
      const themeJson = translateCssToRevenge(css);
      logger3.log("Translated theme: " + JSON.stringify(themeJson));
      ui2.showToast("Theme translated! Check logs.");
    } catch (e) {
      ui2.showToast("Failed to translate theme.");
    }
  };
  return /* @__PURE__ */ jsxDEV(ScrollView, {
    children: [
      /* @__PURE__ */ jsxDEV(FormSection, {
        title: "Vencord Plugins",
        children: [
          /* @__PURE__ */ jsxDEV(FormInput, {
            label: "Plugin URL",
            placeholder: "https://raw.githubusercontent.com/.../plugin.js",
            value: pluginUrl,
            onChange: setPluginUrl
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Button, {
            text: "Install Plugin",
            onPress: handleInstallPlugin,
            style: { margin: 10 }
          }, undefined, false, undefined, this),
          PluginManager.plugins.map((plugin) => /* @__PURE__ */ jsxDEV(FormRow, {
            label: plugin.name,
            subLabel: plugin.description,
            control: /* @__PURE__ */ jsxDEV(FormSwitch, {
              value: plugin.enabled,
              onValueChange: (val) => {
                if (val)
                  plugin.onStart?.();
                else
                  plugin.onStop?.();
                plugin.enabled = val;
              }
            }, undefined, false, undefined, this)
          }, plugin.name, false, undefined, this))
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(FormSection, {
        title: "Theme Translator (CSS to JSON)",
        children: [
          /* @__PURE__ */ jsxDEV(FormInput, {
            label: "CSS Theme URL",
            placeholder: "https://.../theme.css",
            value: themeUrl,
            onChange: setThemeUrl
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Button, {
            text: "Translate and Install Theme",
            onPress: handleInstallTheme,
            style: { margin: 10 }
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/index.ts
var src_default = {
  onLoad: () => {
    initVencordGlobal();
    PluginManager.init();
  },
  onUnload: () => {
    PluginManager.plugins.forEach((p) => {
      if (p.enabled && p.onStop) {
        p.onStop();
      }
    });
  },
  settingsGui: SettingsPage
};
export {
  src_default as default
};
