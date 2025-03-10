import { Plugin, WorkspaceLeaf, EditableFileView, View, FileView, TFile } from 'obsidian';
import type { ViewState } from 'obsidian';
import SearchModel from './model/SearchModel.svelte';
import { DEFAULT_SETTINGS, TabNavigatorSettingTab } from './setting';
import type { PluginSettings } from './setting';

export default class TabSwitcher extends Plugin {
  searchModelInstance: SearchModel | null = null;
  settings: PluginSettings | null = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new TabNavigatorSettingTab(this.app, this));

    this.addCommand({
      id: 'search-tabs',
      name: 'Search tabs',
      callback: () => {
        const { app } = this;
        // Destroy existing instance if it exists
        if (this.searchModelInstance) {
          this.searchModelInstance.$destroy();
          this.searchModelInstance = null;
        }
        // Get current window from active view
        const activeView = app.workspace.getActiveViewOfType(View);
        const currentWindow = activeView?.containerEl.ownerDocument.defaultView ?? window;
        // Create new instance
        this.searchModelInstance = new SearchModel({
          target: currentWindow.document.body,
          props: {
            app,
            currentWindow,
            settings: this.settings,
            removeDuplicateTabs: this.removeDuplicateTabs.bind(this),
          },
        });

        // Add event listener
        this.searchModelInstance.$on('close', () => {
          if (this.searchModelInstance) {
            this.searchModelInstance.$destroy();
            this.searchModelInstance = null;
          }
        });
      },
    });

    // Command to remove duplicate tabs
    this.addCommand({
      id: 'remove-duplicate-tabs',
      name: 'Remove duplicate tabs',
      callback: () => {
        this.removeDuplicateTabs();
      },
    });

    // Command to load all tabs
    this.addCommand({
        id: 'load-all-tabs',
        name: 'Load all tabs',
        callback: () => {
            this.populateTabsFromWorkspaceData();
        }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Method to remove duplicate tabs
  removeDuplicateTabs() {
    const seen = new Set();
    const toRemove: WorkspaceLeaf[] = []; // Array to temporarily store tabs to be removed

    this.app.workspace.iterateAllLeaves(leaf => {
      if (leaf.view instanceof EditableFileView) {
        const file = leaf.view.file;
        if (file && seen.has(file.path)) {
          // Add to removal list if we've seen this file before
          toRemove.push(leaf);
        } else if (file) {
          seen.add(file.path);
        }
      } else if (leaf.view.getViewType() === "empty") {
        toRemove.push(leaf);
      }
    });

    // Remove all tabs in the removal list
    toRemove.forEach(leaf => leaf.detach());
  }

  // Destroy component when plugin is unloaded
  onunload() {
    if (this.searchModelInstance) {
      this.searchModelInstance.$destroy();
    }
  }

  // Method to populate tabs from workspace data without loading them
  private populateTabsFromWorkspaceData() {
    // We don't need to do anything special here, as the tabs are already in the workspace
    // The SearchModel will use app.workspace.iterateAllLeaves() to get all tabs
    // This is just a placeholder method to maintain the API
    // The actual work happens in the SearchModel when it's opened
    
    // If we want to force a refresh of the tab list in any open SearchModel instances:
    if (this.searchModelInstance) {
      this.searchModelInstance.$destroy();
      this.searchModelInstance = null;
    }
  }
}
