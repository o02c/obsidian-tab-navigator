import { Plugin, WorkspaceLeaf, FileView } from 'obsidian';
import SearchModel from './model/SearchModel.svelte';
// import TabViewModel from './model/TabViewModel.svelte';
// import { modalVisible } from './stores/modalStore';

export default class TabSwitcher extends Plugin {
  searchModelInstance: SearchModel | null = null; // SearchModelのインスタンスを保持するためのプロパティ
  // settings: PluginSettings | null = null;
  // tabViewInstance: TabViewModel | null = null;


  async onload() {
    // await this.loadSettings();
    // this.addSettingTab(new TabNavigatorSettingTab(this.app, this))

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
      name: 'Remove duplicate tabs',
      callback: () => {
        this.removeDuplicateTabs();
      },
    });

    // // タブビューを表示する
    // if (this.settings?.enableTabView) {
    //   document.addEventListener('keydown', this.handleKeyDown.bind(this));
    //   document.addEventListener('keyup', this.handleKeyUp.bind(this));
    // }
  }

  // async loadSettings() {
  //   this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

  //   if (!this.settings?.enableTabView && this.tabViewInstance) {
  //     this.tabViewInstance.$destroy();
  //     this.tabViewInstance = null;
  //   }
  // }

  // async saveSettings() {
  //   await this.saveData(this.settings);
  //   if (this.settings?.enableTabView) {
  //     document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  //     document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  //     // キーボードイベントのリスナーを追加
  //     document.addEventListener('keydown', this.handleKeyDown.bind(this));
  //     document.addEventListener('keyup', this.handleKeyUp.bind(this));
  //   }
  // }

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
      } else if (leaf.view.getViewType() === "empty") {
        toRemove.push(leaf);
      }
    });

    // 削除リストにあるタブをまとめて削除
    toRemove.forEach(leaf => leaf.detach());
  }

  // handleKeyDown(event: KeyboardEvent) {
  //   if (!this.settings?.enableTabView) {
  //     return;
  //   }
  //   if (event.ctrlKey && event.key === 'Tab') { // Ctrl+Tabを認識するように変更
  //     event.preventDefault();
  //     if (!this.tabViewInstance) {
  //       this.tabViewInstance = new TabViewModel({
  //         target: this.app.workspace.containerEl,
  //         props: {
  //           app: this.app,
  //         },
  //       });
  //     }
  //     modalVisible.set(true); // モーダルを表示
  //   }
  // }

  // handleKeyUp(event: KeyboardEvent) {
  //   if (!this.settings?.enableTabView) {
  //     return;
  //   }
  //   if (event.key === 'Control' || event.key === 'Escape') {
  //     modalVisible.set(false); // モーダルを非表示
  //   }
  // }

  openSearchModel() {
    const { app } = this;
    if (this.searchModelInstance) {
      this.searchModelInstance.$destroy();
      this.searchModelInstance = null;
    }
    this.searchModelInstance = new SearchModel({
      target: app.workspace.containerEl,
      props: {
        app,
        removeDuplicateTabs: this.removeDuplicateTabs.bind(this),
      },
    });
  }

  // プラグインがアンロードされるときにコンポーネントを破棄
  onunload() {
    if (this.searchModelInstance) {
      this.searchModelInstance.$destroy();
    }
    // if (this.tabViewInstance) {
    //   this.tabViewInstance.$destroy();
    // }
    // document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    // document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
