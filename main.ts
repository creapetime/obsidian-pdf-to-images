import { App, Editor, MarkdownView, Modal, Notice, Menu, Plugin, PluginSettingTab, SuggestModal, Setting, TFile, Vault , PluginManifest} from 'obsidian';
//import { fromPath } from "pdf2pic";
import { fromPath } from 'pdf2picfork';
import { ConvertPluginSettings, DEFAULT_SETTINGS } from './src/settings';
import * as fs from 'fs';
//import { WriteImageResponse } from 'pdf2pic/dist/types/convertResponse';
//import { createReadStream, ReadStream } from 'fs';


// Remember to rename these classes and interfaces!
/*
interface ConvertPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ConvertPluginSettings = {
	mySetting: 'default'
}
*/
export default class ConvertPlugin extends Plugin {
	settings: ConvertPluginSettings;
    private statusDisplay: StatusDisplay | null = null;
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ConvertPluginSettingTab(this.app, this));
		if (this.settings.myOption) {
			new Notice('Die Option ist aktiviert!');
		}

    // Einstellungs-Tab hinzufügen
    this.addSettingTab(new ConvertPluginSettingTab(this.app, this));

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
	
    startConversion(pdfFile : TFile, currentDoc:TFile)	{
			
		const currentDocFilePath: string = this.extractPath(currentDoc);
		
		
		const uri = this.app.vault.getResourcePath(pdfFile);
		const split = uri.split("/");
		let filepath = "";
		let imgfolderpath = "";
		
		for (let i = 3; i < split.length - 1; i++) {
			filepath += split[i] + "/";
		}
		
		if (filepath.includes(currentDocFilePath)) {
			imgfolderpath = filepath;
			new Notice(`Aktuelle Notiz: ${currentDocFilePath}`);
		} 
		else {
			new Notice(`Pdf nicht im Notizverzeichnis:`);
			const newPdfFilepath = this.toAbsolutePath(currentDocFilePath + "Pdfs/");
			this.ensDirSync(newPdfFilepath);
			imgfolderpath = newPdfFilepath;
			this.copyPdftoDir(filepath + pdfFile.name, newPdfFilepath + pdfFile.name);
		}
		
			imgfolderpath = imgfolderpath.replace("/Pdfs", "") + "Imgs/";
			imgfolderpath = imgfolderpath + pdfFile.basename + "/";
			filepath = decodeURI(filepath + pdfFile.name);
			imgfolderpath = decodeURI(imgfolderpath);
			this.ensDirSync(imgfolderpath);
			
		
			// Asynchrone Konvertierung starten und aktuelle Datei übergeben
			this.convertPdfToImages(filepath,imgfolderpath,pdfFile.basename, currentDoc);

			if (this.statusDisplay) {
				this.statusDisplay.removeStatusBars();
			}
	}



	async convertPdfToImages(pdfFilePath: string,imgFolderPath: string,imgFilename:string, docFile: TFile | null): Promise<void> {

		const baseOptions = {
			density: 600, 
			preserveAspectRatio: true,
			format: "jpeg",
			saveFilename: imgFilename,
			savePath: imgFolderPath,
		};

		try {
			const converterinfo = fromPath(pdfFilePath, baseOptions);

			// Seiteninformationen abrufen
			const info = await converterinfo.info();
			const totalPages = info.length;
			new Notice(`Gesamtseiten: ${totalPages}`);
			

			
			// Ersetzen durch tatsächliche Logik, um Seitenanzahl zu ermitteln
			const imagesList: { name: string; path: string }[] = []; // Typ für Bildinformationen
	
			// Fortschrittstracker initialisieren
			//let processedPages = 0;

			
			if (this.statusDisplay) {
				// Beispiel: Fortschritt aktualisieren
				this.statusDisplay.initializeStatusBar();
				this.statusDisplay.updatePageStatus(0, totalPages);
			}
			// Jede Seite einzeln konvertieren
			for (let i = 0; i < totalPages; i++) {
				const currentPage = i + 1; // Seitenzahlen sind 1-basiert
				//new Notice(`Konvertiere Seite ${currentPage}/${totalPages}...`);
	
				const convert = fromPath(pdfFilePath, baseOptions);
	
				// Konvertiere die aktuelle Seite
				const convertedPage = await convert(currentPage, { responseType: "image" })
					.then(resolve => resolve)
					.catch(error => {
						throw new Error(`Fehler beim Konvertieren der Seite ${currentPage}: ${error.message}`);
					});
	
				if (!convertedPage) {
					throw new Error(`Seite ${currentPage} konnte nicht konvertiert werden.`);
				}
	
				// Ergebnis speichern
				if (convertedPage.name && convertedPage.path) {
					imagesList.push({
						name: convertedPage.name,
						path: convertedPage.path,
					});
					if (this.statusDisplay) {
						this.statusDisplay.updatePageStatus(currentPage, totalPages);
					}
				} else {
					throw new Error(`Ungültige Bilddaten für Seite ${currentPage}`);
				}
				// Fortschritt aktualisieren
				//processedPages += 1;
				//new Notice(`Fortschritt: ${processedPages}/${totalPages} Seiten konvertiert`);
			}
	
			// Prüfen, ob Ergebnisse vorhanden sind
			if (imagesList.length === 0) {
				throw new Error("Keine Seiten aus PDF extrahiert.");
			}
	
			//new Notice(`Konvertiert ${imagesList.length} Seiten`);
	
			// Bilder in der ursprünglichen Datei einfügen
			await this.app.vault.process(this.ensTFile(docFile), (data: string) => {
				imagesList.forEach((f) => {
					data += `\n![[${f.name}|1000]]`;
				});
				return data;
			});
	
			new Notice(`Erfolgreich ${imagesList.length} Seiten importiert.`);
		} catch (err) {
			new Notice("Fehler bei der Konvertierung: " + err.message);
		}
	}

	async copyPdftoDir(sourceFilePath: string, targetFilePath: string): Promise<void> {
		try {
			const relSourcePath = this.toRelativePath(sourceFilePath);
			const relTargetPath = this.toRelativePath(targetFilePath);

			// Prüfen, ob die PDFs existieren
			if (!await this.app.vault.adapter.exists(relSourcePath)) {
				new Notice(`Fehler: Die PDF ${relSourcePath} existiert nicht.`);
				return;
			}
			if (await this.app.vault.adapter.exists(relTargetPath)) {
				new Notice(`Warnung: Die PDF ${relTargetPath} existiert bereits.`);
				return;
			}	 
		
			// Verzeichnis erstellen, falls nötig
			const targetDir = relTargetPath.substring(0, relTargetPath.lastIndexOf('/'));
			await this.app.vault.adapter.mkdir(targetDir);
	
			// PDF-Datei kopieren
			const pdfData = await this.app.vault.adapter.readBinary(relSourcePath);
			await this.app.vault.adapter.writeBinary(relTargetPath, pdfData);

			new Notice(`PDF erfolgreich nach ${relTargetPath} kopiert.`);
		} catch (error) {
			new Notice(`Fehler beim Kopieren: ${error.message}`);
		}
	}	 

	inDocFolder(docPath:string,filepath:string)	{
		if (filepath.includes(docPath)) {
		//	new Notice(`Pdf bereits im Notizverzeichnis`);
		} 
		else {
			new Notice(`Pdf nicht im Notizverzeichnis`);
			return false;
		}
	}

	normalizePath(path: string): string {
		return path.replace(/\\/g, '/');
	}
    extractPath(extractionFile :TFile): string	{
		let rawPath: string = this.app.vault.getResourcePath(extractionFile);
		rawPath = rawPath.replace(/^app:\/\/[^/]+\//, '');
		rawPath = rawPath.substring(0, rawPath.lastIndexOf('/') + 1);
		return this.toAbsolutePath(rawPath);
	}
    isRelativePath(path: string): boolean {
		// Prüft, ob der Pfad mit '/' (Linux/Mac) oder 'C:/' (Windows) beginnt
		return !/^(\/|[a-zA-Z]:[\\/])/.test(path);
	}

	toRelativePath(path: string): string {
		let relPath = this.normalizePath(path);
	
		if (this.isRelativePath(relPath)) {
			return relPath;
		}
	
		if (relPath !== decodeURI(relPath)) {
			relPath = decodeURI(relPath);
		}
		//@ts-ignore
		const vaultPath = this.normalizePath(this.app.vault.adapter.basePath);
	
		return relPath.replace(vaultPath + '/', '');
	}
    
    toAbsolutePath(path:string): string {
		let absPath = this.normalizePath(path);

		if(!this.isRelativePath(absPath)) {
			return absPath;
		} 
		if(absPath !== decodeURI(absPath))  {
			absPath = decodeURI(absPath);     
		}
		//@ts-ignore
		const vaultPath = this.normalizePath(this.app.vault.adapter.basePath);
		absPath = (vaultPath + absPath);
		return absPath;
	}
    
	ensDirSync(path: string): void {
		const dirPath: string = this.toAbsolutePath(path);
		
		try {
			if (!fs.existsSync(dirPath)) {
				fs.mkdirSync(dirPath, { recursive: true });
			// new Notice(`Verzeichnis erstellt: ${dirPath}`);
			} else {
			// new Notice(`Verzeichnis existiert bereits: ${dirPath}`);
			}
		} catch (error) {
			if (error instanceof Error) {
				new Notice(`Fehler beim Erstellen des Verzeichnisses: ${error.message}`);
				console.error(`Fehler beim Erstellen des Verzeichnisses: ${error.message}`);
			}
		}
	}
	ensTFile(file: TFile | null): TFile {
		if (file === null) {
			throw new Error("Expected a TFile, but got null");
		}
		return file;
	}

}


export class FileModal extends SuggestModal<TFile> {
    private convertPlugin: ConvertPlugin;

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
		const openNote: TFile | null = this.app.workspace.getActiveViewOfType(MarkdownView)?.file || null;
		if (!openNote) {
			new Notice("Keine aktive Notiz gefunden.");
			return;
		}
		this.convertPlugin.startConversion(pdfFile,openNote);

		// Aktives Markdown-Dokument abrufen
		//const currentDoc :TFile | null = this.app.workspace.getActiveViewOfType(MarkdownView).file;
		
	}
	
}
class ConvertPluginSettingTab extends PluginSettingTab {
	plugin: ConvertPlugin;
  
	constructor(app: App, plugin: ConvertPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
  
	display(): void {
		const { containerEl } = this;
  
		containerEl.empty(); // Alte Inhalte entfernen
		containerEl.createEl('h2', { text: 'Einstellungen für mein Plugin' });
  
		// Beispiel: Umschalten einer Option
		new Setting(containerEl)
		.setName('Meine Option')
		.setDesc('Eine Beschreibung der Option.')
		.addToggle((toggle) =>
			toggle
			.setValue(this.plugin.settings.myOption) // Aktueller Wert
			.onChange(async (value) => {
				this.plugin.settings.myOption = value; // Wert aktualisieren
				await this.plugin.saveSettings(); // Speichern
			})
		);

		// Weitere Option (anotherOption)
		new Setting(containerEl)
		.setName('Eine weitere Option')
		.setDesc('Gib einen Wert für diese Option ein.')
		.addText((text) =>
		text
		.setValue(this.plugin.settings.anotherOption) // Aktueller Wert
		.onChange(async (value) => {
			this.plugin.settings.anotherOption = value; // Wert aktualisieren
			await this.plugin.saveSettings(); // Speichern
		})
		);
	}
  }


/*

		const uri = this.app.vault.getResourcePath(item);
		const split = uri.split('/');
		let filepath = '';
		let savepath = '';
		for(let i = 3; i < split.length - 1; i++) {
			filepath += split[i] + "/";
		}

		savepath = decodeURI(filepath);
		filepath = decodeURI(filepath + item.name);
        
        

		baseOptions.savePath = savepath; 
		const convert = fromPath(filepath, baseOptions).bulk(-1);
		convert.then((imagesList) => {
			const currentDoc = this.app.workspace.getActiveViewOfType(MarkdownView);
			if(currentDoc) {
				this.app.vault.process(currentDoc.file!, data => {
					imagesList.forEach((f) => {
						data += `![[${f.name}|500]]\n`;
					})
					return data;
				});
				new Notice(`Successfully imported ${imagesList.length} pages`);

				
			}
		})
*/

export class StatusDisplay extends Plugin {
	private statusBarItemStat: HTMLElement | null = null;
	private statusBarItemProg: HTMLElement | null = null;
	private progressBar: HTMLElement | null = null;
	private progressContainer: HTMLElement | null = null;
    private static instance: StatusDisplay | null = null;

	static getInstance(app: App, manifest: PluginManifest): StatusDisplay {
		if (!this.instance) {
			this.instance = new StatusDisplay(app, manifest);
		}
		return this.instance;
	}

	initializeStatusBar() {
		// Erstes StatusBar-Item erstellen
		this.statusBarItemStat = this.addStatusBarItem();
		this.statusBarItemProg = this.addStatusBarItem();
	
		if (!this.statusBarItemStat || !this.statusBarItemProg) {
			new Notice('Fehler: StatusBar-Item konnte nicht erstellt werden.');
			return;
		}
		
		this.statusBarItemStat.setText('Bereit');
		this.statusBarItemStat.style.width = '100%';
		this.statusBarItemStat.style.height = '20px';
		this.statusBarItemStat.style.position = 'relative';
	
		this.statusBarItemProg.style.width = '100%';
		this.statusBarItemProg.style.height = '20px';
		this.statusBarItemProg.style.position = 'relative';
	
		// Fortschrittsbalken für das zweite StatusBar-Item
  
		// Container für den Fortschrittsbalken (mit dem Rahmen)
		this.progressContainer = document.createElement('div');
		this.progressContainer.style.width = '100%';  // Container hat immer 100% der Breite
		this.progressContainer.style.height = '9px';  // Höhe des Containers
		this.progressContainer.style.border = '2px solid var(--color-accent)';  // Lila Rahmen
		this.progressContainer.style.borderRadius = '5px';  // Abgerundete Ecken (optional)
		this.progressContainer.style.position = 'relative';
  
		// Fortschrittsbalken erstellen
		this.progressBar = document.createElement('div');
		this.progressBar.style.height = '100%';  // Der Balken nimmt die ganze Höhe des Containers ein
		this.progressBar.style.width = '0%';  // Startwert des Balkens (bei 0%)
		this.progressBar.style.backgroundColor = 'var(--color-accent)';  // Fortschrittsfarbe
		this.progressContainer.style.borderRadius = '5px';
		this.progressBar.style.position = 'absolute';  // Der Balken ist absolut innerhalb des Containers
  
		// Füge den Fortschrittsbalken dem Container hinzu
		this.progressContainer.appendChild(this.progressBar);
  
		// Füge den Container zur Statusbar hinzu
		this.statusBarItemProg.appendChild(this.progressContainer);
  
	
		// Beispielaufruf für das Update der ProgressBar
		this.updatePageStatus(2,100);
	}

		// Funktion zum Aktualisieren der ProgressBar
	updateProgressBar(percentage:number) {
		// Stelle sicher, dass der Prozentsatz im Bereich von 0 bis 100 liegt
		percentage = Math.max(0, Math.min(100, percentage));  // Korrektur auf 0-100%
		
		// Aktualisiere die Breite des Fortschrittsbalkens
		if (this.progressBar) {
			this.progressBar.style.width = `${percentage}%`; // Setze die Breite des Fortschrittsbalkens
		}
	}

	updateStatusBar(currentPage:number,totalPages:number) {
		//this.progressBar.style.width = `${percentage}%`;
		if (this.statusBarItemStat) {
			this.statusBarItemStat.innerHTML = `Seite<br>${currentPage} / ${totalPages}`;
		}
	}
  
	updatePageStatus(currentPage:number,totalPages:number)  {
		if(!(currentPage<=totalPages)) {
			return;
		}
		const percentage = Math.round((currentPage / totalPages) * 100);
		this.updateStatusBar(currentPage,totalPages);
		this.updateProgressBar(percentage);
	}
  
  
	hideStatusBars() {
		if (this.statusBarItemStat) {
			this.statusBarItemStat.style.display = 'none'; // Komplett aus dem Layout entfernen
		// Oder: this.statusBarItemStat.style.visibility = 'hidden'; // Verstecken, aber Platz im Layout behalten
		}
	
		if (this.statusBarItemProg) {
			this.statusBarItemProg.style.display = 'none';
		// Oder: this.statusBarItemProg.style.visibility = 'hidden';
		}
	}

	removeStatusBars() {
		if (this.statusBarItemStat) {
			this.statusBarItemStat.style.display = 'none';
			this.statusBarItemStat.remove();
			this.statusBarItemStat = null; // Verweis entfernen
		}
	
		if (this.statusBarItemProg) {
			this.statusBarItemProg.style.display = 'none';
			this.statusBarItemProg.remove();
			this.statusBarItemProg = null; // Verweis entfernen
		}
	}

}