<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import Fuse from "fuse.js";
	import { App, WorkspaceLeaf, FileView, TFile, getIcon } from "obsidian";
	import type { PluginSettings } from "../setting";
	export let app: App;
	export let removeDuplicateTabs: () => void;
	export let settings: PluginSettings | null;

	const dispatch = createEventDispatcher();
	let modalContainer: HTMLDivElement;

	let searchInput = "";
	let allLeaves: Array<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		aliases: string[];
		tags: string[];
		details: string;
		extention: string | null;
	}> = [];
	let searchResults: Array<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		aliases: string[];
		tags: string[];
		details: string;
		extention: string | null;
	}> = [];
	let selectedIndex = 0;
	let inputElement: HTMLInputElement;
	let fuse: Fuse<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		aliases: string[];
		tags: string[];
		details: string;
		extention: string | null;
	}>;

	onMount(() => {
		// モーダルの外側をクリックしたときにモーダルを閉じる
		function handleClickOutside(event: MouseEvent) {
			const path = event.composedPath();
			if (!path.includes(modalContainer)) {
				dispatch("close");
			}
		}
		document.addEventListener("click", handleClickOutside);

		loadLeaves();
		window.addEventListener("keydown", handleKeyDown);
		if (inputElement) {
			inputElement.focus();
		}
		return () => {
			document.removeEventListener("click", handleClickOutside);
			window.removeEventListener("keydown", handleKeyDown);
		};
	});

	async function loadLeaves() {
		allLeaves = [];
		app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
			let titleOrName: string;
			let details: string;
			let aliases: string[] = [];
			let tags: string[] = [];
			let extention: string | null = null;
			if (leaf.view instanceof FileView) {
				const file = leaf.view.file as TFile;
				titleOrName = file.basename;
				if (settings?.includeFileNameInPath) {
					details = file.path;
				} else {
					details = file.parent?.path ?? "";
				}
				extention = file.extension;
				if (settings?.enableAliasSearch) {
					const fileCache = app.metadataCache.getFileCache(file);
					if (fileCache?.frontmatter?.aliases) {
						aliases = fileCache.frontmatter.aliases;
					}
				}
				if (settings?.enableTagSearch) {
					const fileCache = app.metadataCache.getFileCache(file);
					if (fileCache?.frontmatter?.tags) {
						tags = fileCache.frontmatter.tags;
					}
				}
			} else {
				titleOrName = leaf.view
					.getViewType()
					.replace(/_/g, " ")
					.replace(/^\w/, (c) => c.toUpperCase());
				details = ":" + leaf.view.getViewType();
			}
			allLeaves.push({
				leaf,
				titleOrName,
				aliases,
				tags,
				details,
				extention,
			});
		});
		searchResults = allLeaves;

		// Fuse.jsの設定
		const options = {
			includeScore: true,
			keys: ["titleOrName", "details", "tags", "aliases", "extention"],
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
	<div bind:this={modalContainer} class="prompt">
		<div class="prompt-input-container">
			<input
				class="prompt-input"
				enterkeyhint="done"
				type="text"
				bind:this={inputElement}
				bind:value={searchInput}
				on:input={(event) => handleInput(event)}
				placeholder="Find a note..."
			/>
			<div class="prompt-input-cta"></div>
		</div>
		<div class="prompt-results">
			{#each searchResults as { leaf, titleOrName, aliases, details, tags, extention }, index}
				{#if settings?.showFilePath}
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
								<span
									>{titleOrName}{extention &&
									extention !== "md"
										? "." + extention
										: ""}</span
								>
								{#if settings?.enableAliasSearch && aliases.length > 0}
									<span class="suggestion-note qsp-note">
										{#each aliases as alias}
											{" "}<span class="alias"
												>@{alias}</span
											>
										{/each}
									</span>
								{/if}
								{#if settings?.enableTagSearch && tags.length > 0}
									<span class="suggestion-note qsp-note">
										{#each tags as tag}
											{" "}<span class="tag">#{tag}</span>
										{/each}
									</span>
								{/if}
							</div>
							<div class="suggestion-note qsp-note">
								<span class="qsp-path-indicator">
									{@html getIcon(leaf.getIcon())?.outerHTML ??
										""}
								</span>
								<span class="qsp-path">{details}</span>
							</div>
						</div>
					</div>
				{:else}
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
								<span class="qsp-path-indicator">
									{@html getIcon(leaf.getIcon())?.outerHTML ??
										""}
								</span>
								<span
									>{titleOrName}{extention &&
									extention !== "md"
										? "." + extention
										: ""}</span
								>
								{#if settings?.enableAliasSearch && aliases.length > 0}
									<span class="suggestion-note qsp-note">
										{#each aliases as alias}
											{" "}<span class="alias"
												>@{alias}</span
											>
										{/each}
									</span>
								{/if}
								{#if settings?.enableTagSearch && tags.length > 0}
									<span class="suggestion-note qsp-note">
										{#each tags as tag}
											{" "}<span class="tag">#{tag}</span>
										{/each}
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/if}
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
				<span class="prompt-instruction-command">⇥</span><span
					>to close</span
				>
			</div>
			<div class="prompt-instruction">
				<span class="prompt-instruction-command">⇧ ⇥</span><span
					>to close duplicate</span
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
