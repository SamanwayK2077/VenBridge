import { initVencordGlobal } from "./translator/plugin/vencord";
import { PluginManager } from "./manager/pluginManager";
import { SettingsPage } from "./manager/SettingsPage";

export default {
    onLoad: () => {
        // 1. Initialize Vencord polyfills
        initVencordGlobal();

        // 2. Initialize Plugin Manager (loads and starts Vencord plugins)
        PluginManager.init();
    },
    onUnload: () => {
        // Stop all Vencord plugins
        PluginManager.plugins.forEach(p => {
            if (p.enabled && p.onStop) {
                p.onStop();
            }
        });
    },
    settingsGui: SettingsPage
};
