<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import Fuse from "fuse.js";
	import type { FuseResultMatch } from "fuse.js";
	import { App, WorkspaceLeaf, FileView, TFile, getIcon, View } from "obsidian";
	import type { PluginSettings } from "../setting";
	export let app: App;
	export let currentWindow: Window;
	export let removeDuplicateTabs: () => void;
	export let settings: PluginSettings | null;

	const dispatch = createEventDispatcher();
	let modalContainer: HTMLDivElement;

	let searchInput = "";
	let allLeaves: Array<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		aliases: string;
		tags: string;
		details: string;
		extention: string | null;
		matches: readonly FuseResultMatch[] | undefined;
	}> = [];
	let searchResults: Array<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		aliases: string;
		tags: string;
		details: string;
		extention: string | null;
		matches: readonly FuseResultMatch[] | undefined;
	}> = [];
	let selectedIndex = 0;
	let currentLeafIndex = 0;
	let inputElement: HTMLInputElement;
	let fuse: Fuse<{
		leaf: WorkspaceLeaf;
		titleOrName: string;
		aliases: string;
		tags: string;
		details: string;
		extention: string | null;
	}>;

	onMount(() => {
		function handleClickOutside(event: MouseEvent) {
			const path = event.composedPath();
			if (!path.includes(modalContainer)) {
				dispatch("close");
			}
		}
		currentWindow.document.addEventListener("click", handleClickOutside);

		loadLeaves();
		setCurrentLeafIndex();
		currentWindow.addEventListener("keydown", handleKeyDown);
		if (inputElement) {
			inputElement.focus();
		}
		return () => {
			currentWindow.document.removeEventListener("click", handleClickOutside);
			currentWindow.removeEventListener("keydown", handleKeyDown);
		};
	});

	function setCurrentLeafIndex() {
		const activeLeaf = app.workspace.activeLeaf;
		currentLeafIndex = allLeaves.findIndex(
			(leaf) => leaf.leaf === activeLeaf,
		);
		selectedIndex = currentLeafIndex >= 0 ? currentLeafIndex : 0;
	}

	async function loadLeaves() {
		allLeaves = [];
		app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			if (
				!(
					leaf.view instanceof FileView &&
					!["backlink", "outline", "tag", "outgoing-link"].includes(
						leaf.getViewState().type,
					)
				)
			) {
				return;
			}
			let titleOrName: string;
			let details: string;
			let aliases: string = "";
			let tags: string = "";
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
				if (extention !== "md") {
					titleOrName += "." + extention;
				}
				if (settings?.enableAliasSearch) {
					const fileCache = app.metadataCache.getFileCache(file);
					if (
						fileCache?.frontmatter?.aliases &&
						fileCache.frontmatter.aliases.length > 0
					) {
						aliases =
							"@" + fileCache.frontmatter.aliases.join(" @");
					}
				}
				if (settings?.enableTagSearch) {
					const fileCache = app.metadataCache.getFileCache(file);
					if (fileCache?.frontmatter?.tags) {
						tags = "#" + fileCache.frontmatter.tags.join(" #");
					}
				}
			} else {
				titleOrName = (leaf.view as View)
					.getViewType()
					.replace(/_/g, " ")
					.replace(/^\w/, (c) => c.toUpperCase());
				details = ":" + (leaf.view as View).getViewType();
			}
			allLeaves.push({
				leaf,
				titleOrName,
				aliases,
				tags,
				details,
				extention,
				matches: undefined,
			});
		});
		searchResults = allLeaves;

		// Fuse.js configuration
		const keys = ["titleOrName"];
		if (settings?.showFilePath) {
			keys.push("details");
		}
		if (settings?.enableAliasSearch) {
			keys.push("aliases");
		}
		if (settings?.enableTagSearch) {
			keys.push("tags");
		}
		const options = {
			includeScore: true,
			includeMatches: true,
			keys: keys,
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
			selectedIndex = currentLeafIndex >= 0 ? currentLeafIndex : 0;
		} else {
			searchResults = fuse.search(searchInput).map((result) => {
				console.log(result);
				return {
					...result.item,
					matches: result.matches,
				};
			});
		}
		selectedIndex = 0;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "ArrowDown" || (event.key === "n" && event.ctrlKey)) {
			selectedIndex = (selectedIndex + 1) % searchResults.length;
			event.preventDefault();
		} else if (
			event.key === "ArrowUp" ||
			(event.key === "p" && event.ctrlKey)
		) {
			selectedIndex =
				(selectedIndex - 1 + searchResults.length) %
				searchResults.length;
			event.preventDefault();
		} else if (event.key === "Enter" && !event.isComposing) {
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
		const leaf = selectedItem.leaf;

		app.workspace.setActiveLeaf(leaf, { focus: true });
		
		setTimeout(() => {
		dispatch("close");
		}, 100);
	}

	function removeTab(index: number) {
		searchResults[index].leaf.detach();
	}

	// Highlight matched strings with class="suggestion-highlight"
	function highlightMatches(
		key: string,
		text: string,
		matches: readonly FuseResultMatch[] | undefined,
	) {
		if (!matches) return text;

		// Find matches corresponding to the key
		const match = matches.find((m) => m.key === key);
		if (!match) return text;

		// Highlight the text
		let highlightedText = text;
		// Apply matches from back to front to prevent index shifting
		match.indices
			.slice()
			.reverse()
			.forEach(([start, end]) => {
				const before = highlightedText.substring(0, start);
				const matchText = highlightedText.substring(start, end + 1);
				const after = highlightedText.substring(end + 1);
				highlightedText = `${before}<span class="suggestion-highlight">${matchText}</span>${after}`;
			});

		return highlightedText;
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
			{#each searchResults as { leaf, titleOrName, aliases, details, tags, extention, matches }, index}
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
									>{@html highlightMatches(
										"titleOrName",
										titleOrName,
										matches,
									)}</span
								>
								{#if settings?.enableAliasSearch && aliases.length > 0}
									<span class="suggestion-note qsp-note">
										{" "}<span class="alias"
											>{@html highlightMatches(
												"aliases",
												aliases,
												matches,
											)}</span
										>
									</span>
								{/if}
								{#if settings?.enableTagSearch}
									<span class="suggestion-note qsp-note">
										{" "}<span class="tag"
											>{@html highlightMatches(
												"tags",
												tags,
												matches,
											)}</span
										>
									</span>
								{/if}
							</div>
							<div class="suggestion-note qsp-note">
								<span class="qsp-path-indicator">
									{@html getIcon(leaf.getIcon())?.outerHTML ??
										""}
								</span>
								<span class="qsp-path"
									>{@html highlightMatches(
										"details",
										details,
										matches,
									)}</span
								>
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
									>{@html highlightMatches(
										"titleOrName",
										titleOrName,
										matches,
									)}
								</span>
								{#if settings?.enableAliasSearch && aliases.length > 0}
									<span class="suggestion-note qsp-note">
										{" "}<span class="alias"
											>{@html highlightMatches(
												"aliases",
												aliases,
												matches,
											)}</span
										>
									</span>
								{/if}
								{#if settings?.enableTagSearch && tags.length > 0}
									<span class="suggestion-note qsp-note">
										{" "}<span class="tag"
											>{@html highlightMatches(
												"tags",
												tags,
												matches,
											)}</span
										>
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
					>to exit</span
				>
			</div>
		</div>
	</div>
</div>
