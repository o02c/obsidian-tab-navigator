import { App, PluginSettingTab, Setting } from "obsidian";
import TabViewPlugin from "./main";

export interface PluginSettings {
    showFilePath: boolean;
    includeFileNameInPath: boolean;
    enableTagSearch: boolean;
    enableAliasSearch: boolean;
    loadAllTabsOnStartup: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    showFilePath: true,
    includeFileNameInPath: true,
    enableTagSearch: true,
    enableAliasSearch: true,
    loadAllTabsOnStartup: false,
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
                .setName('Show File Path')
                .setDesc('Show the file path in the search results.')
                .addToggle(toggle => toggle
                    .setValue(settings.showFilePath)
                    .onChange(value => {
                        settings.showFilePath = value;
                        this.plugin.saveSettings();
                    })
                );

            new Setting(containerEl)
                .setName('Include File Name in Path (if show file path is enabled)')
                .setDesc('Include the file name in the file path.')
                .addToggle(toggle => toggle
                    .setValue(settings.includeFileNameInPath)
                    .setDisabled(!settings.showFilePath)
                    .onChange(value => {
                        settings.includeFileNameInPath = value;
                        this.plugin.saveSettings();
                    })
                );

            new Setting(containerEl)
                .setName('Enable Alias Search')
                .setDesc('Enable or disable the ability to search articles using aliases.')
                .addToggle(toggle => toggle
                    .setValue(settings.enableAliasSearch)
                    .onChange(value => {
                        settings.enableAliasSearch = value;
                        this.plugin.saveSettings();
                    })
                );

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

            new Setting(containerEl)
                .setName("Load all tabs on startup (Experimental)")
                .setDesc(
                    "Automatically load all tabs when Obsidian starts. " +
                    "⚠️ This is an experimental feature that might impact startup performance. " +
                    "May not work correctly in all situations."
                )
                .addToggle(toggle => toggle
                    .setValue(settings.loadAllTabsOnStartup)
                    .onChange(async (value) => {
                        settings.loadAllTabsOnStartup = value;
                        await this.plugin.saveSettings();
                    })
                );
        }
    }
}
