import { React } from "@revenge/metro/common";
import { ui } from "@revenge/ui";
import { PluginManager } from "./pluginManager";
import { translateCssToRevenge } from "../translator/theme/cssToRevenge";
import { logger } from "@revenge/utils";

const { ScrollView, View, Text, TextInput, Button } = ui.Components;
const { FormRow, FormSwitch, FormSection, FormInput } = ui.Components;

export const SettingsPage = () => {
    const [pluginUrl, setPluginUrl] = React.useState("");
    const [themeUrl, setThemeUrl] = React.useState("");

    const handleInstallPlugin = async () => {
        if (!pluginUrl) return;
        await PluginManager.installPlugin(pluginUrl);
        setPluginUrl("");
        // Trigger re-render or show toast
    };

    const handleInstallTheme = async () => {
        if (!themeUrl) return;
        try {
            const response = await fetch(themeUrl);
            const css = await response.text();
            const themeJson = translateCssToRevenge(css);
            // In Revenge, themes are usually installed via a specific API or by writing to the themes folder
            // For this manager, we might need to hook into Revenge's theme loader
            logger.log("Translated theme: " + JSON.stringify(themeJson));
            ui.showToast("Theme translated! Check logs.");
        } catch (e) {
            ui.showToast("Failed to translate theme.");
        }
    };

    return (
        <ScrollView>
            <FormSection title="Vencord Plugins">
                <FormInput
                    label="Plugin URL"
                    placeholder="https://raw.githubusercontent.com/.../plugin.js"
                    value={pluginUrl}
                    onChange={setPluginUrl}
                />
                <Button
                    text="Install Plugin"
                    onPress={handleInstallPlugin}
                    style={{ margin: 10 }}
                />
                
                {PluginManager.plugins.map(plugin => (
                    <FormRow
                        key={plugin.name}
                        label={plugin.name}
                        subLabel={plugin.description}
                        control={
                            <FormSwitch
                                value={plugin.enabled}
                                onValueChange={(val) => {
                                    if (val) plugin.onStart?.();
                                    else plugin.onStop?.();
                                    plugin.enabled = val;
                                }}
                            />
                        }
                    />
                ))}
            </FormSection>

            <FormSection title="Theme Translator (CSS to JSON)">
                <FormInput
                    label="CSS Theme URL"
                    placeholder="https://.../theme.css"
                    value={themeUrl}
                    onChange={setThemeUrl}
                />
                <Button
                    text="Translate and Install Theme"
                    onPress={handleInstallTheme}
                    style={{ margin: 10 }}
                />
            </FormSection>
        </ScrollView>
    );
};
