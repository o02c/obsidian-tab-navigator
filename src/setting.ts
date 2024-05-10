import { App, PluginSettingTab, Setting } from "obsidian";
import TabViewPlugin from "./main";

export interface PluginSettings {
    enableTabView: boolean;
}

export const DEFAULT_SETTINGS: Partial<PluginSettings> = {
    enableTabView: false,
};

export class TabNavigatorSettingTab extends PluginSettingTab {
    plugin: TabViewPlugin;

    constructor(app: App, plugin: TabViewPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        const settings = this.plugin.settings;
        if (settings) {
            new Setting(containerEl)
                .setName('(Beta) Enable Tab View')
                .setDesc('Display tab list while holding Ctrl key')
                .addToggle(toggle => toggle
                    .setValue(settings.enableTabView)
                    .onChange(value => {
                        settings.enableTabView = value;
                        this.plugin.saveSettings();
                    })
                );
        }
    }
}

