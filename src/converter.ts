import { Notice, Plugin, TFile } from 'obsidian';

import { fromPath } from 'pdf2picfork';
import { StatusDisplay } from './statusdisplay';
import { ConvertSettings } from './settings';
import { FileUtilities } from './fileutils';
import * as path from 'path';


export class Converter extends Plugin   {
    convertSettings: ConvertSettings;
    futils: FileUtilities;
    //private convertOptions = defaultOptions;
    private statusDisplay: StatusDisplay | null = null;
    copyPdfFolderPath : string;
    copyImgFolderPath : string;
    pdfFolderPath: string;
    imgFolderPath: string;


    async startConversion(pdfFile : TFile,openNote:TFile)	{
        try	{
            //getActiveViewOfType(MarkdownView);
            await this.executeConversion(pdfFile,openNote);
            if(this.convertSettings.copyPdf)	{
                await this.futils.copyPdftoDir((this.pdfFolderPath+pdfFile.name),(this.copyPdfFolderPath+pdfFile.name));
            }
            if (this.convertSettings.deletePdf)	{
                await this.futils.deletePdf(pdfFile); 
            }
        }
        catch (err) {
            new Notice("Fehler bei der Konvertierung: " + err.message);
            return;
        }
    }

    async executeConversion(pdfFile : TFile, currentDoc:TFile)	{
            
        const currentDocFolderPath: string = this.futils.extractPath(currentDoc);
        this.pdfFolderPath = this.futils.extractPath(pdfFile);

        this.imgFolderPath = this.convertSettings.copyImgs ? currentDocFolderPath : this.pdfFolderPath;
        this.imgFolderPath = this.convertSettings.imgSafeFolder ? path.normalize(this.imgFolderPath.concat(this.convertSettings.imgSafeFolder , "/")) : this.imgFolderPath;
        this.imgFolderPath = this.convertSettings.bundleImgFiles ? path.normalize(this.imgFolderPath.concat(pdfFile.basename + "/")) : this.imgFolderPath;
    

        this.copyPdfFolderPath = this.convertSettings.copyPdf ? currentDocFolderPath : "";
        this.copyPdfFolderPath = this.convertSettings.pdfSaveFolder && this.convertSettings.copyPdf ? path.normalize(this.copyPdfFolderPath.concat(this.convertSettings.pdfSaveFolder , "/")) : this.copyPdfFolderPath;

        this.copyImgFolderPath = this.convertSettings.copyImgs ? this.pdfFolderPath : this.copyImgFolderPath;

        new Notice(`PdfFolderPath: ${currentDocFolderPath}`);
        new Notice(`PdfFolderPath: ${this.pdfFolderPath}`);
        new Notice(`ImgFolderPath: ${this.imgFolderPath}`);

        this.futils.ensDirSync(this.imgFolderPath)
        this.copyPdfFolderPath && this.futils.ensDirSync(this.copyPdfFolderPath);
        this.copyImgFolderPath && this.futils.ensDirSync(this.copyImgFolderPath);
        
        await this.convertPdfToImages((this.pdfFolderPath + pdfFile.name),this.imgFolderPath,pdfFile.basename, currentDoc);
        
    }

    async convertPdfToImages(pdfFilePath: string,imgFolderPath: string,imgFilename:string, docFile: TFile | null): Promise<void> {

        this.convertSettings.saveFilename = imgFilename;
        this.convertSettings.savePath = imgFolderPath;

        try {
            const infoConverter = fromPath(pdfFilePath, this.convertSettings);
            const info = await infoConverter.info();
            const totalPages = info.length;
            //new Notice(`Gesamtseiten: ${totalPages}`);
        
            if (this.statusDisplay) {
                // Beispiel: Fortschritt aktualisieren
                this.statusDisplay.initializeStatusBar();
                this.statusDisplay.updatePageStatus(0, totalPages);
            }

            // Jede Seite einzeln konvertieren
            const imagesList: { name: string; path: string }[] = []; // Typ für Bildinformationen

            for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
                //new Notice(`Konvertiere Seite ${currentPage}/${totalPages}...`);

                const convert = fromPath(pdfFilePath, this.convertSettings);
    
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
                //new Notice(`Fortschritt: ${processedPages}/${totalPages} Seiten konvertiert`);
            }
            
            if (this.statusDisplay) {
                this.statusDisplay.removeStatusBars();
            }
            // Prüfen, ob Ergebnisse vorhanden sind
            if (imagesList.length === 0) {
                throw new Error("Keine Seiten aus PDF extrahiert.");
            }
    
            //new Notice(`Konvertiert ${imagesList.length} Seiten`);
    
            //update Note Document
            await this.app.vault.process(this.futils.ensTFile(docFile), (data: string) => {
                imagesList.forEach((f) => {
                    data += `\n![[${f.name}|${this.convertSettings.importSize}]]`;
                });
                return data;
            });

            if (imagesList.length === totalPages)	{
                new Notice(`Konvertierung Erfolgreich`);
            }
            else	{
                throw new Error(`Nicht alle Seiten wurden erfolgreich konvertiert. Es Fehlen ${(totalPages - imagesList.length)} Seiten`);
            }
        } 
        catch (err) {
            throw new Error("Fehler bei der Konvertierung: " + err.message);
        }
    }
}