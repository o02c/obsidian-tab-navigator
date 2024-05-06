<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import { App, WorkspaceLeaf, FileView } from "obsidian";
	export let app: App;
	// export let removeDuplicateTabs: () => void;

	const dispatch = createEventDispatcher();
	let modalContainer: HTMLDivElement;

	let allLeaves: Array<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
	}> = [];
	let tabList: Array<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
	}> = [];
	let selectedIndex = 0;
	let inputElement: HTMLInputElement;
	let isModalVisible = false; // モーダル表示状態の制御変数

	onMount(() => {
		// モーダルの外側をクリックしたときにモーダルを閉じる
		function handleClickOutside(event: MouseEvent) {
			const path = event.composedPath();
			if (!path.includes(modalContainer)) {
				dispatch("close");
			}
		}
		document.addEventListener("click", handleClickOutside);

		window.addEventListener("keydown", handleKeyDown);
		if (inputElement) {
			inputElement.focus();
		}

		// タブの変更を検知するイベントリスナーを追加
		app.workspace.on("active-leaf-change", updateSelectedIndex);

		return () => {
			document.removeEventListener("click", handleClickOutside);
			window.removeEventListener("keydown", handleKeyDown);
			app.workspace.off("active-leaf-change", updateSelectedIndex);
		};
	});

	function updateSelectedIndex() {
		isModalVisible ||= true;
		allLeaves = [];
		app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
			let titleOrName: string;
			let viewType: string;
			if (leaf.view instanceof FileView) {
				const file = leaf.view.file as any; // 型アサーションを使用してエラーを修正
				titleOrName = file.basename;
			} else {
				titleOrName = leaf.view
					.getViewType()
					.replace(/_/g, " ")
					.replace(/^\w/, (c) => c.toUpperCase());
			}
			allLeaves.push({ leaf, titleOrName });
		});
		tabList = allLeaves;
		// 現在ActiveなLeafを選択状態に設定
		const activeLeaf = app.workspace.activeLeaf;
		if (activeLeaf) {
			const activeIndex = tabList.findIndex(
				(item) => item.leaf === activeLeaf,
			);
			if (activeIndex !== -1) {
				selectedIndex = activeIndex;
			}
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Backspace") {
			// event.preventDefault();
			removeTab(selectedIndex);
		}
	}

	function selectItem(index: number) {
		const selectedItem = tabList[index];
		app.workspace.setActiveLeaf(selectedItem.leaf);
		dispatch("close");
	}

	function removeTab(index: number) {
		if (tabList[index]) {
			tabList[index].leaf.detach();
		}
	}
</script>

{#if isModalVisible}
	<!-- モーダルの表示条件を追加 -->
	<div class="modal-container mod-dim">
		<div class="modal-bg" style="opacity: 0.85;"></div>
		<div bind:this={modalContainer} class="prompt">
			<div class="prompt-results">
				{#each tabList as { leaf, titleOrName }, index}
					<div
						class="suggestion-item mod-complex {index ===
						selectedIndex
							? 'is-selected'
							: ''}"
						tabindex="0"
						role="button"
						on:mouseenter={() => (selectedIndex = index)}
						on:click={() => selectItem(index)}
						on:keydown={(event) =>
							event.key === "Enter" && selectItem(index)}
					>
						<div class="suggestion-content">
							<div class="suggestion-title">
								<span>{titleOrName}</span>
							</div>
						</div>
						<div class="suggestion-aux qsp-aux">
							{#if leaf.view instanceof FileView}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="svg-icon lucide-file-text"
									><path
										d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
									></path><polyline points="14 2 14 8 20 8"
									></polyline><line
										x1="16"
										y1="13"
										x2="8"
										y2="13"
									></line><line x1="16" y1="17" x2="8" y2="17"
									></line><polyline points="10 9 9 9 8 9"
									></polyline></svg
								>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<div class="prompt-instructions" data-mode="standard">
				<div class="prompt-instruction">
					<span class="prompt-instruction-command">backspace</span
					><span>to delete</span>
				</div>
			</div>
		</div>
	</div>
{/if}
