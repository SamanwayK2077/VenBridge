import { metro } from "@revenge/metro";
import { ui } from "@revenge/ui";
import { patcher } from "@revenge/patcher";

const VencordPolyfill = {
    Webpack: {
        findByProps: (...props: string[]) => metro.findByProps(...props),
        findByDisplayName: (name: string) => metro.findByName(name), 
        findModule: (filter: (m: any) => boolean) => metro.find(filter),
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
            ReactDOM: () => metro.findByProps("render", "findDOMNode"),
        }
    },
    Plugins: {
        plugins: {} as Record<string, any>,
        get: (name: string) => VencordPolyfill.Plugins.plugins[name],
    },
    Utils: {
        copyText: (text: string) => {
            // Revenge/React Native clipboard
            const { Clipboard } = metro.findByProps("Clipboard");
            Clipboard.setString(text);
            ui.showToast("Copied to clipboard");
        },
        findInTree: (tree: any, filter: (node: any) => boolean) => {
            // Standard Vencord util
            if (filter(tree)) return tree;
            if (Array.isArray(tree)) {
                for (const item of tree) {
                    const res = VencordPolyfill.Utils.findInTree(item, filter);
                    if (res) return res;
                }
            } else if (typeof tree === "object" && tree !== null) {
                for (const key in tree) {
                    const res = VencordPolyfill.Utils.findInTree(tree[key], filter);
                    if (res) return res;
                }
            }
            return null;
        }
    },
    Patcher: {
        before: (mod: any, func: string, patch: any) => patcher.before(mod, func, patch),
        after: (mod: any, func: string, patch: any) => patcher.after(mod, func, patch),
        instead: (mod: any, func: string, patch: any) => patcher.instead(mod, func, patch),
    },
    ui: {
        showToast: (msg: string) => ui.showToast(msg),
        showConfirmationModal: (title: string, content: string, onConfirm: () => void) => {
            // Revenge/Vendetta modal API
            ui.showConfirmationModal({
                title,
                content,
                onConfirm,
                confirmText: "Confirm",
                cancelText: "Cancel",
            });
        }
    }
};

export const definePlugin = (plugin: any) => {
    VencordPolyfill.Plugins.plugins[plugin.name] = plugin;
    return plugin;
};

export const initVencordGlobal = () => {
    (window as any).Vencord = VencordPolyfill;
    (window as any).definePlugin = definePlugin;
};
