import { Plugin, WorkspaceLeaf, EditableFileView, View } from 'obsidian';
import SearchModel from './model/SearchModel.svelte';
import { DEFAULT_SETTINGS, TabNavigatorSettingTab } from './setting';
import type { PluginSettings } from './setting';

export default class TabSwitcher extends Plugin {
  searchModelInstance: SearchModel | null = null; // SearchModelのインスタンスを保持するためのプロパティ
  settings: PluginSettings | null = null;


  async onload() {
    await this.loadSettings();
    this.addSettingTab(new TabNavigatorSettingTab(this.app, this))

    this.addCommand({
      id: 'search-tabs',
      name: 'Search tabs',
      callback: () => {
        const { app } = this;
        // 既存のインスタンスがあれば破棄する
        if (this.searchModelInstance) {
          this.searchModelInstance.$destroy();
          this.searchModelInstance = null;
        }
        // アクティブなビューからカレントウィンドウを取得
        const activeView = app.workspace.getActiveViewOfType(View);
        const currentWindow = activeView?.containerEl.ownerDocument.defaultView ?? window;
        // 新しいインスタンスを作成
        this.searchModelInstance = new SearchModel({
          target: currentWindow.document.body,
          props: {
            app,
            currentWindow,
            settings: this.settings,
            removeDuplicateTabs: this.removeDuplicateTabs.bind(this),
          },
        });

        // イベントリスナーを追加
        this.searchModelInstance.$on('close', () => {
          if (this.searchModelInstance) {
            this.searchModelInstance.$destroy();
            this.searchModelInstance = null;
          }
        });
      },
    });

    // 重複するタブを削除するコマンドを追加
    this.addCommand({
      id: 'remove-duplicate-tabs',
      name: 'Remove duplicate tabs',
      callback: () => {
        this.removeDuplicateTabs();
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // 重複するタブを削除するメソッド
  removeDuplicateTabs() {
    const seen = new Set();
    const toRemove: WorkspaceLeaf[] = []; // 削除するタブを一時的に保存する配列

    this.app.workspace.iterateAllLeaves(leaf => {
      if (leaf.view instanceof EditableFileView) {
        const file = leaf.view.file;
        if (file && seen.has(file.path)) {
          // 既に見たファイルのタブがあれば削除リストに追加
          toRemove.push(leaf);
        } else if (file) {
          seen.add(file.path);
        }
      } else if (leaf.view.getViewType() === "empty") {
        toRemove.push(leaf);
      }
    });

    // 削除リストにあるタブをまとめて削除
    toRemove.forEach(leaf => leaf.detach());
  }


  openSearchModal() {
    const { app } = this;
    if (this.searchModelInstance) {
      this.searchModelInstance.$destroy();
      this.searchModelInstance = null;
    }
    const activeView = app.workspace.getActiveViewOfType(View);
    const currentWindow = activeView?.containerEl.ownerDocument.defaultView ?? window
    const modal = new SearchModel({
      target: document.body,
      props: {
        app,
        currentWindow: currentWindow,
        removeDuplicateTabs: this.removeDuplicateTabs.bind(this),
        settings: this.settings,
      }
    });
    modal.open();
  }

  // プラグインがアンロードされるときにコンポーネントを破棄
  onunload() {
    if (this.searchModelInstance) {
      this.searchModelInstance.$destroy();
    }
  }
}
