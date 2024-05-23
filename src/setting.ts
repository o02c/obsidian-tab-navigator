import { App, PluginSettingTab, Setting } from "obsidian";
import TabViewPlugin from "./main";

export interface PluginSettings {
    enableTagSearch: boolean;
}

export const DEFAULT_SETTINGS: Partial<PluginSettings> = {
    enableTagSearch: true,
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
                .setName('Enable Tag Search')
                .setDesc('Enable or disable the ability to search articles using tags.')
                .addToggle(toggle => toggle
                    .setValue(settings.enableTagSearch)
                    .onChange(value => {
                        settings.enableTagSearch = value;
                        this.plugin.saveSettings();
                    })
                );
        }
    }
}