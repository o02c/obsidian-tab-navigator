import { Plugin, WorkspaceLeaf, FileView } from 'obsidian';
import SearchModel from './SearchModel.svelte'; // Svelte コンポーネントをインポート

export default class TabSwitcher extends Plugin {
  searchModelInstance: SearchModel | null = null; // SearchModelのインスタンスを保持するためのプロパティ

  async onload() {
    this.addCommand({
      id: 'search-tabs',
      name: 'Search Tabs',
      callback: () => {
        const { app } = this;
        // 既存のインスタンスがあれば破棄する
        if (this.searchModelInstance) {
          this.searchModelInstance.$destroy();
          this.searchModelInstance = null;
        }
        // 新しいインスタンスを作成
        this.searchModelInstance = new SearchModel({
          target: app.workspace.containerEl,
          props: {
            app,
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
      name: 'Remove Duplicate Tabs',
      callback: () => {
        this.removeDuplicateTabs();
      },
    });
  }

  // 重複するタブを削除するメソッド
  removeDuplicateTabs() {
    const seen = new Set();
    const toRemove: WorkspaceLeaf[] = []; // 削除するタブを一時的に保存する配列

    this.app.workspace.iterateAllLeaves(leaf => {
      if (leaf.view instanceof FileView) {
        const file = leaf.view.file;
        if (file && seen.has(file.path)) {
          // 既に見たファイルのタブがあれば削除リストに追加
          toRemove.push(leaf);
        } else if (file) {
          seen.add(file.path);
        }
      }
    });

    // 削除リストにあるタブをまとめて削除
    toRemove.forEach(leaf => leaf.detach());
  }

  // プラグインがアンロードされるときにコンポーネントを破棄
  onunload() {
    if (this.searchModelInstance) {
      this.searchModelInstance.$destroy();
    }
  }
}
