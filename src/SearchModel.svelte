<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import Fuse from "fuse.js";
	import { App, WorkspaceLeaf, FileView } from "obsidian";
	export let app: App;
	export let removeDuplicateTabs: () => void;

	const dispatch = createEventDispatcher();

	let searchInput = "";
	let allLeaves: Array<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		details: string;
	}> = [];
	let searchResults: Array<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		details: string;
	}> = [];
	let selectedIndex = 0;
	let inputElement: HTMLInputElement;
	let fuse: Fuse<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		details: string;
	}>;

	onMount(() => {
		loadLeaves();
		window.addEventListener("keydown", handleKeyDown);
		if (inputElement) {
			inputElement.focus();
		}
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	});

	async function loadLeaves() {
		allLeaves = [];
		app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
			let titleOrName: string;
			let details: string;
			if (leaf.view instanceof FileView) {
				const file = leaf.view.file as any; // 型アサーションを使用してエラーを修正
				titleOrName = file.basename;
				details = file.path;
			} else {
				titleOrName = leaf.view
					.getViewType()
					.replace(/_/g, " ")
					.replace(/^\w/, (c) => c.toUpperCase());
				details = leaf.view.getViewType();
			}
			allLeaves.push({ leaf, titleOrName, details });
		});
		searchResults = allLeaves;

		// Fuse.jsの設定
		const options = {
			includeScore: true,
			keys: ["titleOrName", "details"],
		};
		fuse = new Fuse(allLeaves, options);
	}

	function handleInput(event: Event) {
		const inputElement = event.currentTarget as HTMLInputElement;
		searchInput = inputElement.value;
		filterSearchResults();
	}

	function filterSearchResults() {
		if (searchInput.trim() === "") {
			searchResults = allLeaves;
		} else {
			searchResults = fuse
				.search(searchInput)
				.map((result) => result.item);
		}
		selectedIndex = 0;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "ArrowDown") {
			selectedIndex = (selectedIndex + 1) % searchResults.length;
			event.preventDefault();
		} else if (event.key === "ArrowUp") {
			selectedIndex =
				(selectedIndex - 1 + searchResults.length) %
				searchResults.length;
			event.preventDefault();
		} else if (event.key === "Enter") {
			selectItem(selectedIndex);
		} else if (event.key === "Escape") {
			dispatch("close");
		} else if (event.key === "Tab" && event.shiftKey) {
			event.preventDefault();
			removeDuplicateTabs();
			loadLeaves();
      filterSearchResults();
		} else if (event.key === "Tab") {
			event.preventDefault();
      const prevIndex = selectedIndex;
			removeTab(selectedIndex);
			loadLeaves();
      filterSearchResults();
			if (searchResults.length == 0) {
				dispatch("close");
			}
      selectedIndex = Math.min(prevIndex, searchResults.length - 1);
		}
	}

	function selectItem(index: number) {
		const selectedItem = searchResults[index];
		app.workspace.setActiveLeaf(selectedItem.leaf);
		dispatch("close");
	}

	function removeTab(index: number) {
		searchResults[index].leaf.detach();
	}
</script>

<div class="modal-container mod-dim">
	<div class="modal-bg" style="opacity: 0.85;"></div>
	<div class="prompt">
		<div class="prompt-input-container">
			<input
				class="prompt-input"
				enterkeyhint="done"
				type="text"
				bind:this={inputElement}
				bind:value={searchInput}
				on:input={(event) => handleInput(event)}
				placeholder="Find or create a note..."
			/>
			<div class="prompt-input-cta"></div>
		</div>
		<div class="prompt-results">
			{#each searchResults as { leaf, titleOrName, details }, index}
				<div
					class="suggestion-item mod-complex {index === selectedIndex
						? 'is-selected'
						: ''}"
          tabindex="0"
					role="button"
          on:mouseenter={() => selectedIndex = index} 
					on:click={() => selectItem(index)}
					on:keydown={(event) =>
						event.key === "Enter" && selectItem(index)}
				>
					<div class="suggestion-content">
						<div class="suggestion-title">
							<span>{titleOrName}</span>
						</div>
						<div class="suggestion-note qsp-note">
							<span class="qsp-path-indicator">
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
										></path><polyline
											points="14 2 14 8 20 8"
										></polyline><line
											x1="16"
											y1="13"
											x2="8"
											y2="13"
										></line><line
											x1="16"
											y1="17"
											x2="8"
											y2="17"
										></line><polyline points="10 9 9 9 8 9"
										></polyline></svg
									>
								{:else}
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
										class="svg-icon lucide-folder-open"
										><path
											d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
										></path></svg
									>
								{/if}
							</span>
							<span class="qsp-path">{details}</span>
						</div>
					</div>
					<div class="suggestion-aux qsp-aux">
						<!-- ここに追加のアイコンや情報を表示 -->
					</div>
				</div>
			{/each}
		</div>
		<div class="prompt-instructions" data-mode="standard">
			<div class="prompt-instruction">
				<span class="prompt-instruction-command">↑↓</span><span
					>to navigate</span
				>
			</div>
			<div class="prompt-instruction">
				<span class="prompt-instruction-command">↵</span><span
					>to open</span
				>
			</div>
			<div class="prompt-instruction">
				<span class="prompt-instruction-command">tab</span><span
					>to delete</span
				>
			</div>
			<div class="prompt-instruction">
				<span class="prompt-instruction-command">shift + tab</span><span
					>to delete duplicate</span
				>
			</div>
			<div class="prompt-instruction">
				<span class="prompt-instruction-command">esc</span><span
					>to close</span
				>
			</div>
		</div>
	</div>
</div>
