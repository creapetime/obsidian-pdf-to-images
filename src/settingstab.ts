import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { ConvertSettings } from './settings';
import ConvertPlugin  from '../main';


export class SettingsTab extends PluginSettingTab {
    plugin: ConvertPlugin;
    settings: ConvertSettings
    constructor( plugin: ConvertPlugin, app: App, settings: ConvertSettings ) {
        super(app, plugin);
        this.plugin = plugin;
        this.settings = settings;
    }
    display(): void {
        const { containerEl } = this;
  
        containerEl.empty(); 


        containerEl.createEl('h4', { text: 'Importeinstellungen' });

        // Setting: importsize
        new Setting(containerEl)
            .setName('Importgröße')
            .setDesc('Größe mit der das Bild in die Notiz importiert wird ')
            .addText((text) => text
                .setPlaceholder('0 - 5000 Px')
                .setValue(this.settings.importSize.toString()) 
                .onChange(async (value) => {
                    const number = parseInt(value);
                    if (!isNaN(number) && number >= 0 && number <= 5000) {
                        this.settings.importSize = number; 
                        await this.plugin.saveSettings();
                    } 
                    else {
                        new Notice('Bitte gib eine gültige Zahl zwischen 0 und 5000 ein.'); 
                    }
                })
            );

        containerEl.createEl('h4', { text: 'Konvertierungseinstellungen' });
  
        // Option: quality
        new Setting(containerEl)
        .setName('Quality')
        .setDesc('Bildkompressionslevel von 0 bis 100')
        .addText((text) => text
            .setPlaceholder('0 - 100 %')
            .setValue(this.settings.quality.toString())
            .onChange(async (value) => {
                const number = parseInt(value);
                if (!isNaN(number) && number >= 0 && number <= 100) {
                    this.settings.quality = number; 
                    await this.plugin.saveSettings();
                } 
                else {
                    new Notice('Bitte gib eine gültige Zahl zwischen 0 und 100 ein.'); 
                }
            })
        );

        // Setting: density
        new Setting(containerEl)
        .setName('Density')
        .setDesc('Pixeldichte in DPI von 0 bis 1200')
        .addText((text) => text
            .setPlaceholder('0 - 1200 DPI')
            .setValue(this.settings.density.toString()) 
            .onChange(async (value) => {
                const number = parseInt(value);
                if (!isNaN(number) && number >= 0 && number <= 1200) {
                    this.settings.density = number; 
                    await this.plugin.saveSettings();
                } 
                else {
                    new Notice('Bitte gib eine gültige Zahl zwischen 0 und 100 ein.'); 
                }
            })
        );

        // Setting: width
        new Setting(containerEl)
        .setName('Breite')
        .setDesc('Bildbreite in Pixel')
        .addText((text) => text
            .setPlaceholder('0 - 3072 Pixel')
            .setValue(this.settings.width.toString()) 
            .onChange(async (value) => {
                const number = parseInt(value);
                if (!isNaN(number) && number >= 0 && number <= 3072) {
                    this.settings.width = number; 
                    await this.plugin.saveSettings();
                } 
                else {
                    new Notice('Bitte gib eine gültige Zahl zwischen 0 und 3072 ein.');
                }
            })
        );
        // Setting: height
        new Setting(containerEl)
        .setName('Höhe')
        .setDesc('Bildhöhe in Pixel')
        .addText((text) => text
            .setPlaceholder('0 - 2048 Pixel')
            .setValue(this.settings.height.toString()) 
            .onChange(async (value) => {
                const number = parseInt(value);
                if (!isNaN(number) && number >= 0 && number <= 2048) {
                    this.settings.height = number; 
                    await this.plugin.saveSettings();
                } 
                else {
                    new Notice('Bitte gib eine gültige Zahl zwischen 0 und 2048 ein.'); 
                }
            })
        );

        // Setting: preserveAspectRatio
        new Setting(containerEl)
        .setName('Seitenverhältnis beibehalten')
        .setDesc('Behält das Seitenverhältnis des Bildes bei. Höhe und Breite werden als Mindestbreite bzw. Mindesthöhe interpretiert.')
        .addToggle((toggle) =>
            toggle
            .setValue(this.settings.preserveAspectRatio) 
            .onChange(async (value) => {
                this.settings.preserveAspectRatio = value; 
                await this.plugin.saveSettings(); 
            })
        );


        // Setting: format
        new Setting(containerEl)
            .setName("Bildformat")
            .setDesc("Wähle ein Bildformat aus der Liste aus.")
            .addDropdown((dropdown) => {
                const formats = [
                    "PNG",
                    "JPEG",
                    "BMP",
                    "TIFF",
                    "WebP",
                    "HEIF",
                    "SVG",
                    "EPS"
                ];

                formats.forEach((format) => dropdown.addOption(format, format.toLowerCase()));
                dropdown.setValue(this.settings.format.toUpperCase());
                dropdown.onChange((formatValue) => {
                    this.settings.format = formatValue; 
                    this.plugin.saveSettings(); 

                });
            }
        );

        // Setting: compression
        new Setting(containerEl)
            .setName("Kompressionsformat wählen")
            .setDesc("Wähle ein Kompressionsformat aus der Liste aus.")
            .addDropdown((dropdown) => {
                const formats = [
                    "None",
                    "BZip",
                    "Fax",
                    "Group3",
                    "Group4",
                    "JPEG",
                    "Lossless",
                    "LZW",
                    "RLE",
                    "Zip",
                    "LZMA",
                    "JPEG2000",
                    "JBIG",
                    "JBIG2",
                    "WebP",
                    "ZSTD"
                ];
       
                formats.forEach((format) => dropdown.addOption(format, format.toLowerCase()));
                dropdown.setValue(this.settings.compression.toUpperCase());
                dropdown.onChange((formatValue) => {
                    this.settings.compression = formatValue; // Speichere die valide Zahl
                    this.plugin.saveSettings(); 
                });
            });

        containerEl.createEl('h4', { text: 'Speichereinstellungen' });


        //Setting: copyImgs
        new Setting(containerEl)
            .setName('Bilddatein kopieren')
            .setDesc('Kopiert die Bilddatein in das Notizverzeichnis bzw. in den Bilder Speicherordner im Notizverzeichnis')
            .addToggle((toggle) =>
                toggle
                .setValue(this.settings.copyImgs) 
                .onChange(async (value) => {
                    this.settings.copyImgs = value; 
                    await this.plugin.saveSettings(); 
                })
            );
        /*
        //Setting: deleteImgs
        if(this.plugin.convertSettings.copyImgs)	{
            new Setting(containerEl)
                .setName('Lösche Original Bilddatein')
                .setDesc('Löscht die Bilddatein nach dem kopieren')
                .addToggle((toggle) =>
                    toggle
                    .setValue(this.plugin.convertSettings.deleteImgs) 
                    .onChange(async (value) => {
                        this.plugin.convertSettings.deleteImgs = value; 
                        await this.plugin.saveSettings(); 
                    })
                );
        }*/

        //Setting: imgsavefolder
        new Setting(containerEl)
            .setName('Bilder Speicherordner')
            .setDesc('Name für einen optionalen Unterordner in welchen die Bilddatein gespeichert werden')
            .addText((text) => text
                .setPlaceholder('Ordnername')
                .setValue(this.settings.imgSafeFolder.toString())
                .onChange(async (value) => {
                    this.settings.imgSafeFolder = this.sanitizeFolderName(value); 
                    await this.plugin.saveSettings();
                })
            );

        //Setting: copyPdf	
        new Setting(containerEl)
            .setName('Pdf kopieren')
            .setDesc('Kopiert die Pdf Datei in das Notizverzeichnis bzw. in den Pdf Speicherordner im Notizverzeichnis')
            .addToggle((toggle) =>
                toggle
                .setValue(this.settings.copyPdf) 
                .onChange(async (value) => {
                    this.settings.copyPdf = value; 
                    await this.plugin.saveSettings(); 
                })
            );

        //Setting: deletePdf	
        new Setting(containerEl)
            .setName('Pdf löschen')
            .setDesc('Löscht die ausgewählte Pdf Datei nach der Konvertierung')
            .addToggle((toggle) =>
                toggle
                .setValue(this.settings.deletePdf) 
                .onChange(async (value) => {
                    this.settings.deletePdf = value; 
                    await this.plugin.saveSettings(); 
                })
            );
        

        //Setting: pdfsavefolder
        new Setting(containerEl)
            .setName('Pdf Speicherordner')
            .setDesc('Name für einen optionalen Unterordner im Notizverzeichnis in welchen die Pdf Datei kopiert wird')
            .addText((text) => text
                .setPlaceholder('Ordnername')
                .setValue(this.settings.pdfSaveFolder.toString())
                .onChange(async (value) => {
                    this.settings.pdfSaveFolder = this.sanitizeFolderName(value); 
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Seiten Bündeln')
            .setDesc('Bündelt alle Bilddatein eines Pdf Dokuments in einem eigenen Ordner')
            .addToggle((toggle) =>
                toggle
                .setValue(this.settings.bundleImgFiles) 
                .onChange(async (value) => {
                    this.settings.bundleImgFiles = value; 
                    await this.plugin.saveSettings(); 
                })
            );
    }

    sanitizeFolderName(name: string): string {
        const maxLength = 255;
        const sanitized = name.replace(/[\\/:*?"<>|\0]/g, '').trim().replace(/\.$/, '');
        return sanitized.substring(0, maxLength);
    }
        
}