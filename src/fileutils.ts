import { Notice, Plugin, TFile } from 'obsidian';
import * as path from 'path';
import * as fs from 'fs';

export class FileUtilities extends Plugin   {

    async copyPdftoDir(sourceFilePath: string, targetFilePath: string): Promise<void> {

        const relSourcePath = this.toRelativePath(sourceFilePath);
        let relTargetPath = this.toRelativePath(targetFilePath);

            // Prüfen, ob die PDFs existieren
        if (!await this.app.vault.adapter.exists(relSourcePath)) {
            throw new Error(`Fehler: Die PDF ${relSourcePath} existiert nicht.`);
        }
        if (await this.app.vault.adapter.exists(relTargetPath)) {
            new Notice(`Warnung: Die PDF ${relTargetPath} existiert bereits.`);
            relTargetPath =  await this.makeUnique(relTargetPath,1);		
        }	 
        
            // Verzeichnis erstellen, falls nötig
        const targetDir = relTargetPath.substring(0, relTargetPath.lastIndexOf('/'));
        await this.app.vault.adapter.mkdir(targetDir);
    
            // PDF-Datei kopieren
        const pdfData = await this.app.vault.adapter.readBinary(relSourcePath);
        await this.app.vault.adapter.writeBinary(relTargetPath, pdfData);

        new Notice(`PDF erfolgreich nach ${relTargetPath} kopiert.`);
        
    }	 


    async copyImgstoDir(sourceFilePath: string, targetFilePath: string): Promise<void> {
        return;
    }
    async deletePdf(fileToDelete:TFile)	{
        try{
            if (fileToDelete instanceof TFile) {
                await this.app.vault.delete(fileToDelete);
            } else {
                throw new Error(`Datei existiert nicht oder ist kein TFile`);
            }
        }
        catch (err) {
            new Notice("Fehler beim löschen der originalen Pdf:");
        }
    }

    async makeUnique(filePath: string, attempt:number): Promise<string> {
    
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
    
        // Wenn attempt 1 ist, bleibt der Dateiname unverändert
        const uniqueFileName = attempt === 1 ? `${base}${ext}` : `${base} (${(attempt-1)})${ext}`;
        const uniqueFilePath = path.join(dir, uniqueFileName);
    
        // Existiert der Pfad? Dann rufe die Funktion erneut mit erhöhtem attempt auf
        if (await this.app.vault.adapter.exists(uniqueFilePath)) {
            if(attempt <= 99)	{
                return this.makeUnique(filePath, attempt + 1);
            }
            else{
                throw new Error(`Konnte keinen eindeutigen Dateinamen erstellen (Versuche überschritten)`);
            }
        }
    
        return uniqueFilePath;
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

    extractPath(extractionFile: TFile): string {
        let rawPath: string = this.app.vault.getResourcePath(extractionFile);
        rawPath = rawPath.replace(/^app:\/\/[^/]+\//, '');
        rawPath = rawPath.substring(0, rawPath.lastIndexOf('/'));
        rawPath = decodeURIComponent(rawPath) + "/";
        rawPath = path.normalize(rawPath);
        return rawPath;
    }
    
        
    isRelativePath(path: string): boolean {
        return !/^(\/|[a-zA-Z]:[\\/])/.test(path);
    }
    
    toRelativePath(inputPath: string): string {
        //@ts-ignore
        const vaultPath = path.normalize(this.app.vault.adapter.basePath);
        return path.relative(vaultPath, inputPath);
    }
        
    toAbsolutePath(relativePath: string): string {
        //@ts-ignore
        const vaultPath = path.normalize(this.app.vault.adapter.basePath);
        return path.resolve(vaultPath, relativePath);
    }
}