//import { App, Editor, MarkdownView, Modal, Notice, Menu, Plugin, PluginSettingTab, SuggestModal, Setting, TFile, Vault , PluginManifest} from 'obsidian';
import { App, Notice, Plugin, SuggestModal, TFile } from 'obsidian';
//import { fromPath } from 'pdf2picfork';

import { Converter } from './src/converter';
import { SettingsTab } from './src/settingstab';
import { StatusDisplay } from './src/statusdisplay';
import { ConvertSettings, DEFAULT_SETTINGS } from './src/settings';
export default class ConvertPlugin extends Plugin {
	settings: ConvertSettings;
	converter: Converter;
    statusDisplay: StatusDisplay | null = null;

	async onload() {

		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));
		this.converter =  new Converter(this.app, this.manifest);
		this.statusDisplay = StatusDisplay.getInstance(this.app, this.manifest);

		this.addRibbonIcon('file-down', 'Import PDF as image', (event) => {
			new FileModal(this.app,this).open();
		});

		this.addCommand({
			id: "obsidian-pdf-to-images",
			name: "Import PDF as images to current file",
			callback: () => {
				new FileModal(this.app,this).open();
			}
		})

		this.statusDisplay = StatusDisplay.getInstance(this.app, this.manifest);

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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


export class FileModal extends SuggestModal<TFile> {
    convertPlugin: ConvertPlugin;

    constructor(app: App, convertPlugin: ConvertPlugin) {
        super(app);
        this.convertPlugin = convertPlugin;
    }
   // private statusDisplay: StatusDisplay = StatusDisplay.getInstance(this.app, this.manifest);

	getSuggestions(query: string): TFile[] | Promise<TFile[]> {
		return this.app.vault.getFiles().filter(t => {
			return t.extension.toLowerCase() == "pdf" && t.name.toLowerCase().includes(query.toLowerCase());
		})
	}

	renderSuggestion(value: TFile, el: HTMLElement) {
		el.createEl("div", {text: value.name});
		el.createEl("small", {text: value.path});
	}

	onChooseSuggestion(pdfFile: TFile, evt: MouseEvent | KeyboardEvent) {
		const openNote: TFile | null = this.app.workspace.getActiveFile();
		if (!openNote) {
			new Notice("Keine aktive Notiz gefunden.");
			return;
		}
		this.convertPlugin.converter.startConversion(pdfFile,openNote);
	}
	
}