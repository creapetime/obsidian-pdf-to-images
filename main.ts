//import { App, Editor, MarkdownView, Modal, Notice, Menu, Plugin, PluginSettingTab, SuggestModal, Setting, TFile, Vault , PluginManifest} from 'obsidian';
import { App, Notice, Plugin, Setting, SuggestModal, TFile,TFolder } from 'obsidian';
//import { fromPath } from 'pdf2picfork';

import { FileUtilities } from './src/fileutils';
import { Converter } from './src/converter';
import { SettingsTab } from './src/settingstab';
import { StatusDisplay } from './src/statusdisplay';
import { ConvertSettings, DEFAULT_SETTINGS } from './src/settings';
export default class ConvertPlugin extends Plugin {
	settings: ConvertSettings;
	converter: Converter;
    statusDisplay: StatusDisplay | null = null;
	futils: FileUtilities;
	tempVisible = false;

	async onload() {
		console.log("Load Plugin Pdf-Images");
		await this.loadSettings();
		this.futils = new FileUtilities(this.app,this.manifest);
		this.addSettingTab(new SettingsTab(this , this.app, this.settings , this.futils));
		this.statusDisplay = StatusDisplay.getInstance(this.app, this.manifest);
		this.converter =  new Converter(this,this.manifest, this.app, this.settings, this.futils, this.statusDisplay);

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
		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		});

		this.registerToFolderMenu();

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		this.waitForLayout(this.initFolderVisibility);
		//this.clearVisibilitySettings();

	}

	onunload() {
		this.saveSettings();
		
	}




	registerToFolderMenu()	{
		this.app.workspace.on('file-menu', (menu, file) => {
            if (file instanceof TFile) {
				//console.log("Es ist eine Datei!");
			} 
			else if (file instanceof TFolder) {
				const isvisible = !this.futils.isHidden(file.path);
				const isPdf = this.futils.isPdfFolderPath(file.path);
				const isImg = this.futils.isImgFolderPath(file.path);
				menu.addItem((item) => {
					item.setTitle(isvisible ?'Ordner verstecken':'Ordner wieder anzeigen')  // Titel der Option
						.setIcon(isvisible ? "eye" : "eye-off")  // Optional: füge ein Icon hinzu
						.onClick(() => {
		 					//!this.futils.isVisible(file.path);
							this.futils.initVisibilityByPath(file.path,isPdf,isImg,!isvisible);
							this.setVisibilitySetting(file.path,isPdf,isImg,!isvisible);
							console.log(`isVisible(${file.path}):`, this.futils.isVisible(file.path));
							if(isvisible){new Notice(`Ordner wird nicht mehr angezeigt`);}
							if(!isvisible){new Notice(`Ordner wird wieder angezeigt`);}
							
							this.saveSettings();
							
						}); // Aktion, die ausgeführt wird
                });
				menu.addItem((item) => {
					item.setTitle(this.tempVisible ? 'versteckte Ordner ausblenden' : 'versteckte Ordner einblenden')  // Titel der Option
						.setIcon(this.tempVisible ? "eye" : "eye-off")  // Optional: füge ein Icon hinzu
						.onClick(() => {
							this.tempVisible = !this.tempVisible;
							!this.tempVisible && this.futils.rehideHiddenFolders();
							this.tempVisible && this.futils.tempUnhideAllFolders();
							this.tempVisible && new Notice(`Versteckte Ordner temporär aufgedeckt`);
							!this.tempVisible && new Notice(`Versteckte Ordner wieder ausgeblendet`);
						}); // Aktion, die ausgeführt wird
                });
			}
		});
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		const oldsettings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.mergeSettings(oldsettings,this.settings);
		await this.saveData(oldsettings);
		this.clearVisibilitySettings();
	}
	
	setVisibilitySetting(path:string,pdfFolder:boolean,imgFolder:boolean,visible:boolean)	{
		const key = `${visible?"visible":"hidden"}${pdfFolder?"Pdf":""}${imgFolder?"Img":""}Folders`;
		if (key in this.settings) {
			const setting = this.settings[key as keyof ConvertSettings];
			if (Array.isArray(setting)) {
				const normalizedPath = this.futils.normalizeSlashes(this.futils.toRelativePath(path),false);
				console.log(`##`);
				console.log(`NewSetting: ${key},Setting:${setting} Path: ${normalizedPath}`);
				setting.push(normalizedPath);
			}
		} 
		else {
			console.error(`Invalid key: ${key}`);
		}
	}

/*
	setVisibilitySetting(path: string, pdfFolder: boolean, imgFolder: boolean, visible: boolean): void {
		const key = `${visible ? "visible" : "hidden"}${pdfFolder ? "Pdf" : ""}${imgFolder ? "Img" : ""}Folders`;
	
		if (key in this.settings) {
			const setting = this.settings[key as keyof ConvertSettings];
	
			if (Array.isArray(setting)) {
				const normalizedPath = this.futils.normalizeSlashes(this.futils.toRelativePath(path), false);
	
				// Prüfen, ob der Pfad bereits in der Liste ist
				if (!setting.includes(normalizedPath)) {
					// Entfernen des Pfades aus der gegensätzlichen Liste (z. B. hidden vs. visible)
					const oppositeKey = visible
						? `hidden${pdfFolder ? "Pdf" : ""}${imgFolder ? "Img" : ""}Folders`
						: `visible${pdfFolder ? "Pdf" : ""}${imgFolder ? "Img" : ""}Folders`;
	
					if (oppositeKey in this.settings) {
						const oppositeSetting = this.settings[oppositeKey as keyof ConvertSettings];
						if (Array.isArray(oppositeSetting)) {
							const index = oppositeSetting.indexOf(normalizedPath);
							if (index !== -1) {
								oppositeSetting.splice(index, 1); // Entfernen aus der gegensätzlichen Liste
								console.log(`Removed ${normalizedPath} from ${oppositeKey}`);
							}
						}
					}
	
					// Hinzufügen zur aktuellen Liste
					setting.push(normalizedPath);
					console.log(`Added ${normalizedPath} to ${key}`);
				} else {
					console.log(`Path ${normalizedPath} already exists in ${key}`);
				}
			}
		} else {
			console.error(`Invalid key: ${key}`);
		}
	}*/
/*
	mergeSettings(oldSettings: Record<string, any>, newSettings: Record<string, any>): void {
		Object.keys(newSettings).forEach(key => {
			const setting = newSettings[key];
	
			if (!Array.isArray(setting) || typeof setting[0] !== "string") {
				// Direkte Übernahme für primitive Typen oder Objekte
				oldSettings[key] = setting;
			} else {
				const deleteKey = key.includes("hidden")
					? key.replace("hidden", "visible")
					: key.includes("visible")
					? key.replace("visible", "hidden")
					: key;
	
				if (deleteKey === key) {
					return;
				}
	
				if (!oldSettings[deleteKey]) {
					oldSettings[deleteKey] = []; // Initialisierung, falls deleteKey nicht existiert
				}
	
				// Merge der spezifischen Arrays
				console.log(`Merges Setting: ${key}, Path: ${setting}`);
				this.mergeVisibilitySettings(oldSettings[key], setting, oldSettings[deleteKey]);
	
				if (key.includes("Img") || key.includes("Pdf")) {
					// Entfernen von Duplikaten aus allgemeinen Ordnern
					oldSettings.hiddenFolders = oldSettings.hiddenFolders.filter(
						(folder: string) => !oldSettings[key].includes(folder)
					);
					oldSettings.visibleFolders = oldSettings.visibleFolders.filter(
						(folder: string) => !oldSettings[key].includes(folder)
					);
	
					console.log(`Deletes hiddenFolder Settings: ${oldSettings[key]}, Path: ${oldSettings.hiddenFolders}`);
					console.log(`Deletes visibleFolder Settings: ${oldSettings[key]}, Path: ${oldSettings.visibleFolders}`);
				}
			}
		});
	}
	mergeVisibilitySettings(oldSetting: string[], newSetting: string[], deleteSetting: string[]): void {
		if (newSetting.length === 0) {
			return;
		}
	
		// Hinzufügen neuer Pfade zu oldSetting (ohne Duplikate)
		newSetting.forEach(newFolderPath => {
			if (!oldSetting.includes(newFolderPath)) {
				console.log(`Merging Settings: OldPath: ${oldSetting} with ${newSetting}`);
				oldSetting.push(newFolderPath);
			}
		});
	
		if (deleteSetting.length === 0) {
			return;
		}
	
		// Entfernen von Pfaden aus deleteSetting, die in newSetting enthalten sind
		deleteSetting.forEach((folderPath, index) => {
			if (newSetting.includes(folderPath)) {
				console.log(`Deletes Setting: ${deleteSetting}, Path: ${folderPath}`);
				deleteSetting.splice(index, 1);
			}
		});
	
		// Zusätzliche Überprüfung: Keine Überschneidungen zwischen oldSetting und deleteSetting
		oldSetting.forEach((folderPath, index) => {
			if (deleteSetting.includes(folderPath)) {
				console.log(`Removing duplicate from oldSetting: ${folderPath}`);
				oldSetting.splice(index, 1);
			}
		});
	}*/



/*
	mergeVisibilitySettings(oldSettings: Record<string, any>,newSetting: string[],currentSettingsKey: string): void {
		const currentSetting = oldSettings[currentSettingsKey];
		if (newSetting.length === 0) {
			return;
		}
	
		newSetting.forEach((newFolderPath) => {
			const oppositeKey = currentSettingsKey.includes("hidden")? "visibleFolders": "hiddenFolders";
	
			// 1. Entferne den Pfad aus der entgegengesetzten Liste
			if (oppositeKey in oldSettings && Array.isArray(oldSettings[oppositeKey])) {
				this.deleteSetting(oldSettings[oppositeKey], newFolderPath);
			}
	
			// 2. Füge den Pfad zur aktuellen Liste hinzu, falls er nicht bereits existiert
			if (!currentSetting.includes(newFolderPath)) {
				console.log(
					`Merging Settings: Adding ${newFolderPath} to ${currentSettingsKey}`
				);
				currentSetting.push(newFolderPath);
			}
	
			// 3. Lösche den Pfad aus redundanten Ordnerlisten
			if (currentSettingsKey.includes("Img") || currentSettingsKey.includes("Pdf")) {
				this.deleteDuplicates(oldSettings, currentSettingsKey, newFolderPath);
			} else {
				this.deleteSetting(oldSettings[oppositeKey], newFolderPath);
			}
		});
	}*/

	mergeSettings(oldSettings: Record<string, any>, newSettings: Record<string, any>): void {
		console.log('Full oldSettings:', JSON.stringify(oldSettings, null, 2));
		Object.keys(newSettings).forEach(key => {
			//console.log(`NewSettingsData ${key}:Data: ${newSettings[key]}`);
			//console.log('Full oldSettings:', JSON.stringify(oldSettings, null, 2));
			//console.log(`OldSettingsData ${key}:Data: ${oldSettings[key]}`);
			//console.log(`OldSettingsData Opposite ${this.getOppositeKey(key)}:Data: ${oldSettings[this.getOppositeKey(key)]}`);
			const setting = newSettings[key];
	
			if (!Array.isArray(setting) || typeof setting[0] !== "string"|| setting.length === 0) {
				// Direkte Übernahme für primitive Typen oder Objekte
				if (setting.length === 0) {
					return;
				}
				oldSettings[key] = setting;
				console.log(`Key ${key}wirddirekt übertragen:Data: ${oldSettings[key]}`);
			} 
			else {
				console.log('Full oldSettings:', JSON.stringify(oldSettings, null, 2));
				//console.log(`OldSettingsData ${key}:Data: ${oldSettings[key]}`);
				//console.log(`OldSettingsData Opposite ${this.getOppositeKey(key)}:Data: ${oldSettings[this.getOppositeKey(key)]}`);
				//console.log(`OldSettingsData ${key}:Data: ${oldSettings[key]}`);
				//console.log(`OldSettingsData Opposite ${this.getOppositeKey(key)}:Data: ${oldSettings[this.getOppositeKey(key)]}`);
				this.mergeVSetting(oldSettings,setting,key);	
			}
			//console.log(`NewSettingsAFTERMERGE ${key}:Data: ${newSettings[key]}`);
			//console.log(`OldSettingsAFTERMERGE ${key}:Data: ${oldSettings[key]}`);
		});
	}
	mergeVSetting(oldSettings: Record<string, any>,newSettingArray: string[],key: string)	{
		if (newSettingArray.length === 0) {
			return;
		}
		//console.log(`BEVORE FIRSTFunction OldSetting ${this.getOppositeKey(key)}:Data: ${oldSettings[this.getOppositeKey(key)]}`);
		//console.log(`BEVORE FIRSTFunction SettingNewFolderPath ${this.getOppositeKey(key)}:Data: ${newSettingArray}`);
		//console.log(`NewSettingArray for ${key}:${newSettingArray}`);
		newSettingArray.forEach(newFolderPath => {
			//console.log(`BEVORE SECONDFunction OldSetting ${this.getOppositeKey(key)}:Data: ${oldSettings[this.getOppositeKey(key)]}`);
			//console.log(`BEVORE SEVONDFunction SettingNewFolderPath ${this.getOppositeKey(key)}:Data: ${newSettingArray}`);
			if(!key.includes("Img") && !key.includes("Pdf"))	{	
				Object.keys(oldSettings).forEach((setting) => {
					if (Array.isArray(setting) && (setting.includes("Img") || setting.includes("Pdf"))) {
						//console.log(`Setting ${setting}includes Img or Pdf`);
						if(oldSettings[setting].some((existingPath:string) => existingPath === newFolderPath))	{
							if(!setting.includes(key.replace("Folders","")))	{
								//console.log(`Pushing ${oldSettings[this.getOppositeKey(setting)]} with ${newFolderPath}`);
								oldSettings[this.getOppositeKey(setting)].push(newFolderPath);
								//console.log(`BEVORE Deletes Setting1 ${oldSettings[setting]}:Data: ${newFolderPath}`);
								this.deleteSetting(oldSettings[setting],newFolderPath);
								//console.log(`AFTER Deletes Setting1 ${oldSettings[setting]}:Data: ${newFolderPath}`);
							}
						}
					} 
				});
			}
			//console.log(`BEVORE Function OldSetting ${this.getOppositeKey(key)}:Data: ${oldSettings[this.getOppositeKey(key)]}`);
			//console.log(`BEVORE Function SettingNewFolderPath ${this.getOppositeKey(key)}:Data: ${newFolderPath}`);

			if (!oldSettings[key].some((existingPath:string) => existingPath === newFolderPath)) {
				console.log(`Append Setting ${key}: with NewFolderPath: ${newFolderPath}`);
				oldSettings[key].push(newFolderPath);
				console.log(`OldSettingscombined: Setting ${key}: ${oldSettings[key]}`);
			}
			console.log(`BEVORE Deletes OldSetting ${this.getOppositeKey(key)}:Data: ${oldSettings[this.getOppositeKey(key)]}`);
			console.log(`BEVORE Deletes SettingNewFolderPath ${this.getOppositeKey(key)}:Data: ${newFolderPath}`);
			this.deleteSetting(oldSettings[this.getOppositeKey(key)],newFolderPath);
			console.log(`AFTER Deletes OldSetting ${this.getOppositeKey(key)}:Data: ${oldSettings[this.getOppositeKey(key)]}`);
			console.log(`AFTER Deletes SettingNewFolderPath ${this.getOppositeKey(key)}:Data: ${newFolderPath}`);
			if(key.includes("Img") || key.includes("Pdf"))	{	
				console.log(`Setting is in Img orPdf included... Deleting FolderPathsfor ${newFolderPath}`);
				this.deleteSetting(oldSettings["hiddenFolders"],newFolderPath);
				this.deleteSetting(oldSettings["visibleFolders"],newFolderPath);
			}
		});
	}
	getOppositeKey(key:string):string{
		return key.includes("hidden")?key.replace("hidden","visible"):key.replace("visible","hidden");
	}
	/*
	deleteSetting(deleteSetting: string[], deletePath: string): void {
		if (deleteSetting.length === 0 || !deletePath) return;
	
		const initialLength = deleteSetting.length;
		const updatedList = deleteSetting.filter((path) => path !== deletePath);
	
		if (updatedList.length !== initialLength) {
			console.log(`Removed ${deletePath} from list${deleteSetting}`);
			deleteSetting.length = 0;
			console.log(`Removed ${updatedList} updatedList`);
			deleteSetting.push(...updatedList);
		}
	}*/
	deleteSetting(settingArray: string[], deletePath: string): void {
		if (!settingArray || settingArray.length === 0 || !deletePath) {
			console.log(`Nothing to delete: deletePath=${deletePath}, settingArray=${settingArray}`);
			return;
		}
	
		const index = settingArray.indexOf(deletePath);
		if (index !== -1) {
			console.log(`Removing ${deletePath} from array: ${settingArray}`);
			settingArray.splice(index, 1); // Entfernt nur das spezifische Element
			console.log(`Updated array after deletion: ${settingArray}`);
		} else {
			console.log(`Path ${deletePath} not found in array: ${settingArray}`);
		}
	}
	
	mergeVisibilitySettings(oldSettings: Record<string, any>,currentnewSettingArray: string[],currentSettingsKey: string): void {

		const currentoldSettingArray = oldSettings[currentSettingsKey];
		if (currentnewSettingArray.length === 0) return;
	
		const oppositeKey = currentSettingsKey.includes("hidden")? "visibleFolders": "hiddenFolders";
	
		currentnewSettingArray.forEach((newFolderPath) => {
			// Entferne den Pfad aus der gegenüberliegenden Liste
			if (oppositeKey in oldSettings && Array.isArray(oldSettings[oppositeKey])) {
				console.log(`Removing ${newFolderPath} from ${oppositeKey}`);
				this.deleteSetting(oldSettings[oppositeKey], newFolderPath);
			}
	
			// Füge den Pfad zur aktuellen Liste hinzu
			if (!currentoldSettingArray.includes(newFolderPath)) {
				console.log(`Adding ${newFolderPath} to ${currentSettingsKey}`);
				currentoldSettingArray.push(newFolderPath);
			}
	
			// Synchronisiere spezifische Listen (Img/Pdf)
			if (currentSettingsKey.includes("Img") || currentSettingsKey.includes("Pdf")) {
				this.synchronizeSpecificLists(oldSettings, newFolderPath, currentSettingsKey);
			}
		});
	}
	synchronizeSpecificLists(settings: Record<string, any>,path: string,currentKey: string): void {
		const isHidden = currentKey.includes("hidden");
		const specificKey = isHidden ? "hiddenImgFolders" : "visibleImgFolders";
		const oppositeKey = isHidden ? "visibleImgFolders" : "hiddenImgFolders";
	
		// Entferne den Pfad aus der gegenüberliegenden spezifischen Liste
		if (oppositeKey in settings && Array.isArray(settings[oppositeKey])) {
			console.log(`Removing ${path} from ${oppositeKey}`);
			this.deleteSetting(settings[oppositeKey], path);
		}
	
		// Füge den Pfad zur aktuellen spezifischen Liste hinzu
		if (specificKey in settings && Array.isArray(settings[specificKey])) {
			if (!settings[specificKey].includes(path)) {
				console.log(`Adding ${path} to ${specificKey}`);
				settings[specificKey].push(path);
			}
		}
	}
	


	deleteDuplicates(settings: Record<string, any>, currentKey: string, currentPath: string): void {
		Object.keys(settings).forEach((key) => {
			if (key !== currentKey && Array.isArray(settings[key])) {
				const list = settings[key];
				if (list.includes(currentPath)) {
					console.log(`Removing duplicate ${currentPath} from ${key}`);
					this.deleteSetting(list, currentPath);
				}
			}
		});
	}/*
	deleteSetting(deleteSetting: string[], deletePath: string): void {
		if (deleteSetting.length === 0 || !deletePath) return;
	
		const initialLength = deleteSetting.length;
		const updatedList = deleteSetting.filter((path) => path !== deletePath);
	
		if (updatedList.length !== initialLength) {
			console.log(`Removed ${deletePath} from list${deleteSetting}`);
			deleteSetting.length = 0;
			console.log(`Removed ${updatedList} updatedList`);
			deleteSetting.push(...updatedList);
		}
	}
*/
	
	
	async waitForLayout(executeFunction: () => void): Promise<boolean> {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				if (this.app.workspace.layoutReady) {
					clearInterval(interval);
					executeFunction();
					resolve(true);
				}
			}, 100); // Prüfen alle 100ms
		});
	}
	initFolderVisibility = () => {	
		setTimeout(async () => {
			console.log(`Layout ist bereit! Plugin-Logik wird ausgeführt.`);
			console.log(`HiddenPdfFolders: ${this.settings.hiddenPdfFolders}`);
			console.log(`HiddenImgFolders: ${this.settings.hiddenImgFolders}`);
			console.log(`HiddenFolders: ${this.settings.hiddenFolders}`);
			console.log(`VisiblePdfFolders: ${this.settings.visiblePdfFolders}`);
			console.log(`VisibleImgFolders: ${this.settings.visibleImgFolders}`);
			console.log(`VisibleFolders: ${this.settings.visibleFolders}`);
			this.futils.initFolderArrayVisibility(this.settings.hiddenPdfFolders,true,false,false);
			this.futils.initFolderArrayVisibility(this.settings.hiddenImgFolders,false,true,false);
			this.futils.initFolderArrayVisibility(this.settings.visiblePdfFolders,true,false,true);
			this.futils.initFolderArrayVisibility(this.settings.visibleImgFolders,false,true,true);
			this.futils.initFolderArrayVisibility(this.settings.visibleFolders,false,false,true);
			this.futils.initFolderArrayVisibility(this.settings.hiddenFolders,false,false,false);
			this.clearVisibilitySettings();
		}, 2000);
	}
	async clearVisibilitySettings()	{
		this.settings.hiddenImgFolders = [];
		this.settings.hiddenPdfFolders = [];
		this.settings.visibleImgFolders = [];
		this.settings.visiblePdfFolders = [];
		this.settings.visibleFolders = [];
		this.settings.hiddenFolders = [];
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