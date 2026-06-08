const MAPPING: Record<string, string> = {
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
    "--interactive-muted": "INTERACTIVE_MUTED",
};

export const translateCssToRevenge = (css: string) => {
    const semanticColors: Record<string, string[]> = {};
    const rawColors: Record<string, string> = {};

    // Very simple regex to find CSS variable definitions
    // Matches: --variable-name: #hex;
    const varRegex = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\(.*?\))/g;
    let match;

    while ((match = varRegex.exec(css)) !== null) {
        const [_, varName, value] = match;
        
        if (MAPPING[varName]) {
            const semanticKey = MAPPING[varName];
            // Revenge expects [dark, light]. 
            // Vencord themes are usually dark by default.
            // For now, we'll use the same color for both or just dark.
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
        rawColors,
    };
};
