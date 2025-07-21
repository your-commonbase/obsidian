import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface ThreadNode {
	id: string;
	content: string;
	metadata: {
		parent_id?: string;
		alias_ids: string[];
	};
}

interface MyPluginSettings {
	ycbUrl: string;
	ycbApiKey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	ycbUrl: 'https://yourcommonbase.com/',
	ycbApiKey: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	private async addToYCB(data: string, parentId?: string): Promise<any> {
		const response = await fetch(`${this.settings.ycbUrl}/add`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.settings.ycbApiKey}`,
			},
			body: JSON.stringify({
				data: data,
				metadata: {
					title: "Thread Entry"
				},
				...(parentId && { parent_id: parentId })
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to add to YCB: ${response.statusText}`);
		}

		return await response.json();
	}

	private async uploadThreadToYCB(threadNodes: ThreadNode[]): Promise<void> {
		const idMapping: { [key: string]: string } = {};
		
		// Sort nodes to process parents before children
		const sortedNodes = [...threadNodes].sort((a, b) => {
			if (!a.metadata.parent_id && b.metadata.parent_id) return -1;
			if (a.metadata.parent_id && !b.metadata.parent_id) return 1;
			return 0;
		});

		for (const node of sortedNodes) {
			try {
				const parentYcbId = node.metadata.parent_id ? idMapping[node.metadata.parent_id] : undefined;
				const result = await this.addToYCB(node.content, parentYcbId);
				
				// Store mapping from our node ID to YCB ID
				idMapping[node.id] = result.id;
				
				console.log(`Added node ${node.id} -> ${result.id}`);
			} catch (error) {
				console.error(`Failed to add node ${node.id}:`, error);
				new Notice(`Failed to upload node: ${node.content.substring(0, 50)}...`);
				throw error;
			}
		}

		new Notice(`Successfully uploaded ${threadNodes.length} nodes to YCB!`);
	}

	private parseNestedList(text: string): ThreadNode[] {
		const lines = text.split('\n');
		const nodes: ThreadNode[] = [];
		const parentStack: { id: string; level: number }[] = [];
		let nodeCounter = 1;

		for (const line of lines) {
			const trimmedLine = line.trim();
			if (!trimmedLine.startsWith('-') && !trimmedLine.startsWith('*')) {
				continue;
			}

			const content = trimmedLine.substring(1).trim();
			if (!content) continue;

			const indentLevel = (line.match(/^\s*/)?.[0].length || 0) / 4;
			const nodeId = `node_${nodeCounter++}`;

			// Find parent based on indent level
			while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= indentLevel) {
				parentStack.pop();
			}

			const parentId = parentStack.length > 0 ? parentStack[parentStack.length - 1].id : undefined;

			const node: ThreadNode = {
				id: nodeId,
				content: content,
				metadata: {
					parent_id: parentId,
					alias_ids: []
				}
			};

			// Add this node as a child to its parent
			if (parentId) {
				const parentNode = nodes.find(n => n.id === parentId);
				if (parentNode) {
					parentNode.metadata.alias_ids.push(nodeId);
				}
			}

			nodes.push(node);
			parentStack.push({ id: nodeId, level: indentLevel });
		}

		return nodes;
	}

	async onload() {
		await this.loadSettings();
		// This adds the save thread command
		this.addCommand({
			id: 'save-thread',
			name: 'Save Thread',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selectedText = editor.getSelection();
				const textToProcess = selectedText || editor.getValue();
				
				const threadNodes = this.parseNestedList(textToProcess);
				const jsonOutput = JSON.stringify(threadNodes, null, 2);
				
				// Copy to clipboard and show notification
				navigator.clipboard.writeText(jsonOutput).then(() => {
					new Notice('Thread JSON copied to clipboard!');
				}).catch(() => {
					// Fallback: show in modal if clipboard fails
					new ThreadOutputModal(this.app, jsonOutput).open();
				});
			}
		});

		// This adds the upload to YCB command
		this.addCommand({
			id: 'upload-thread-to-ycb',
			name: 'Upload Thread to YCB',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if (!this.settings.ycbApiKey) {
					new Notice('Please set YCB API Key in plugin settings first!');
					return;
				}

				const selectedText = editor.getSelection();
				const textToProcess = selectedText || editor.getValue();
				
				const threadNodes = this.parseNestedList(textToProcess);
				
				if (threadNodes.length === 0) {
					new Notice('No valid bullet points found to upload!');
					return;
				}

				try {
					new Notice('Uploading thread to YCB...');
					await this.uploadThreadToYCB(threadNodes);
				} catch (error) {
					console.error('Upload failed:', error);
					new Notice('Failed to upload thread to YCB. Check console for details.');
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new YCBSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ThreadOutputModal extends Modal {
	private jsonOutput: string;

	constructor(app: App, jsonOutput: string) {
		super(app);
		this.jsonOutput = jsonOutput;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl('h2', { text: 'Thread JSON Output' });
		
		const pre = contentEl.createEl('pre');
		pre.createEl('code', { text: this.jsonOutput });
		pre.style.backgroundColor = '#f5f5f5';
		pre.style.padding = '10px';
		pre.style.borderRadius = '5px';
		pre.style.maxHeight = '400px';
		pre.style.overflow = 'auto';

		const copyButton = contentEl.createEl('button', { text: 'Copy to Clipboard' });
		copyButton.onclick = () => {
			navigator.clipboard.writeText(this.jsonOutput).then(() => {
				new Notice('JSON copied to clipboard!');
				this.close();
			});
		};
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class YCBSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('YCB URL')
			.setDesc('Your Common Base URL')
			.addText(text => text
				.setPlaceholder('https://yourcommonbase.com/backend')
				.setValue(this.plugin.settings.ycbUrl)
				.onChange(async (value) => {
					this.plugin.settings.ycbUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('YCB API Key')
			.setDesc('Your Common Base API Key')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.ycbApiKey)
				.onChange(async (value) => {
					this.plugin.settings.ycbApiKey = value;
					await this.plugin.saveSettings();
				}));

	}
}
