import { storage } from "@revenge/utils";
import { logger } from "@revenge/utils";
import { applyVencordPatches } from "../translator/plugin/patchTranslator";

interface VencordPlugin {
    name: string;
    description: string;
    authors: { name: string; id: string | bigint }[];
    onStart?(): void;
    onStop?(): void;
    patches?: any[];
    enabled: boolean;
    url?: string;
}

export class PluginManager {
    static plugins: VencordPlugin[] = [];

    static init() {
        if (!storage.vencordPlugins) {
            storage.vencordPlugins = [];
        }
        this.plugins = storage.vencordPlugins;
        this.startEnabledPlugins();
    }

    static async installPlugin(url: string) {
        try {
            const response = await fetch(url);
            const code = await response.text();
            
            // Execute plugin code
            const pluginFunc = new Function("definePlugin", "Vencord", code);
            pluginFunc(window.definePlugin, window.Vencord);
            
            // The plugin should now be in Vencord.Plugins.plugins
            // We need to find it. For now, we'll just check the last added one.
            const pluginNames = Object.keys(window.Vencord.Plugins.plugins);
            const pluginName = pluginNames[pluginNames.length - 1];
            const plugin = window.Vencord.Plugins.plugins[pluginName];

            if (plugin) {
                plugin.url = url;
                plugin.enabled = true;
                
                // Save to storage
                this.plugins.push(plugin);
                storage.vencordPlugins = this.plugins;

                // Apply patches and start
                applyVencordPatches(plugin.name, plugin.patches);
                if (plugin.onStart) plugin.onStart();

                logger.log(`Installed Vencord plugin: ${plugin.name}`);
            }
        } catch (e) {
            logger.error(`Failed to install plugin from ${url}: ${e}`);
        }
    }

    static startEnabledPlugins() {
        this.plugins.forEach(p => {
            if (p.enabled && p.onStart) {
                try {
                    p.onStart();
                } catch (e) {
                    logger.error(`Error starting plugin ${p.name}: ${e}`);
                }
            }
        });
    }

    static stopPlugin(name: string) {
        const plugin = this.plugins.find(p => p.name === name);
        if (plugin && plugin.onStop) {
            plugin.onStop();
            plugin.enabled = false;
        }
    }
}
