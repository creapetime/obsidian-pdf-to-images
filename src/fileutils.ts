import { Notice, Plugin, TFile, } from 'obsidian';
import * as path from 'path';
import * as fs from 'fs';


export class FileUtilities extends Plugin   {
    private settings = {
        areFoldersHidden: true,
        CaseInsensitive: false,
      };
    private querySelector = 
    `.pdf-images-pdffolder--hidden,
     .pdf-images-imgfolder--hidden,
     .pdf-images-folder--hidden,
     .pdf-images-pdffolder--visible,
     .pdf-images-imgfolder--visible,
     .pdf-images-folder--visible`;

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
        if (!path.isAbsolute(inputPath)) {
            // Relativen Pfad relativ zur Vault in einen absoluten Pfad umwandeln
            return inputPath;
        }

        //@ts-ignore
        const vaultPath = path.normalize(this.app.vault.adapter.basePath);
        return path.relative(vaultPath, inputPath);
    }  
    toAbsolutePath(inputPath: string): string {
        if (path.isAbsolute(inputPath)) {
            // Relativen Pfad relativ zur Vault in einen absoluten Pfad umwandeln
            return inputPath;
        }
        //@ts-ignore
        const vaultPath = path.normalize(this.app.vault.adapter.basePath);
        return path.resolve(vaultPath, inputPath);
    }
    isVisible(relativeFolderPath :string) : boolean  {
        const relFolderPath = this.toRelativePath(relativeFolderPath);
      //  this.checkPath(relFolderPath);
        const folderElements = this.getNodeListbyPath(relFolderPath);
        if (folderElements.length === 1 ) {
            return this.isVisibleElement(folderElements[0]);
        }   
        else{
            throw new Error(`Fehler in Visiblecheck: Der Ordner ${relFolderPath} konnte nicht gefunden werden.`);
        }
    }
    isHidden(relativeFolderPath :string) : boolean  {
        const relFolderPath = this.toRelativePath(relativeFolderPath);
       // this.checkPath(relFolderPath);
        const folderElements = this.getNodeListbyPath(relFolderPath);
        if (folderElements.length === 1 ) {
            return this.isHiddenElement(folderElements[0]);
        }   
        else{
            throw new Error(`Fehler in Hiddencheck: Der Ordner ${relFolderPath} konnte nicht gefunden werden.`);
        }
    }
    isPdfFolderPath(relativeFolderPath :string) : boolean   {
        const relFolderPath = this.toRelativePath(relativeFolderPath);
        this.checkPath(relFolderPath);
        const folderElements = this.getNodeListbyPath(relFolderPath);
        if (folderElements.length === 1 ) {
            return this.isPdfFolderElement(folderElements[0]);
        }   
        else{
            throw new Error(`Fehlerin PdfFolderPathcheck: Der Ordner ${relFolderPath} konnte nicht gefunden werden.`);
        }
    }
    isImgFolderPath(relativeFolderPath :string) : boolean   {
        const relFolderPath = this.toRelativePath(relativeFolderPath);
        this.checkPath(relFolderPath);
        const folderElements = this.getNodeListbyPath(relFolderPath);
        if (folderElements.length === 1 ) {
            return this.isImgFolderElement(folderElements[0]);
        }   
        else{
            throw new Error(`Fehler in ImgFolderPathcheck: Der Ordner ${relFolderPath} konnte nicht gefunden werden.`);
        }
    }

    isPdfFolderElement(folder:HTMLElement):boolean     { 
        return this.classListIncludes(folder,"pdffolder");
    }
    isImgFolderElement(folder:HTMLElement):boolean     {
        return this.classListIncludes(folder,"imgfolder");
    }
    isVisibleElement(folder:HTMLElement):boolean     {
        const result = this.classListIncludes(folder, "visible");
        //console.log(`Prüfung auf sichtbare Klasse: ${result}`);
        return result;
    }
    isHiddenElement(folder:HTMLElement):boolean     {
        const result = this.classListIncludes(folder, "hidden");
        //console.log(`Prüfung auf versteckte Klasse: ${result}`);
        return result;
    }
 
    async setVisibilityByPath( folderPath: string, visible: boolean ): Promise<void> {
        const relFolderPath = this.toRelativePath(folderPath);
        //this.checkPath(relFolderPath);
        const folderElements = this.getNodeListbyPath(relFolderPath);

        if (folderElements.length === 0) {
            throw new Error(`Fehler: Der Ordner ${relFolderPath} konnte nicht gefunden werden.`);
        }
    
        folderElements.forEach((folder) => {
            if (!folder)    {
                return;
            }
            const isPdfFolder = this.isPdfFolderElement(folder);
            const isImgFolder = this.isImgFolderElement(folder);
            this.removeClassLists(folder);
            this.addFolderClassList(folder,isPdfFolder,isImgFolder,visible);
            this.addFolderStyles(folder,visible);
        });
    }
    async setVisibilityByAttributes( pdfFolders: boolean , imgFolders :boolean , visible: boolean , setVisibility:boolean): Promise<void> {
        const folderElements = this.getNodeListByAttributes(pdfFolders,imgFolders,visible);

        if (folderElements.length === 0) {
            throw new Error(`Fehler in setVisibilityByAttributes: Keine Ordner mit den angegebenen Attributen gefunden`);
        }
    
        folderElements.forEach((folder) => {
            if (!folder)    {
                return;
            }
            this.removeClassLists(folder);
            this.addFolderClassList(folder,pdfFolders,imgFolders,setVisibility);
            this.addFolderStyles(folder,setVisibility);
        });
    }
    normalizeSlashes(path:string,backslash :boolean)   {
        if(backslash)   {
            return path.replace(/\//g, '\\');
        }
        else{
            return path.replace(/\\/g, '/');
        }
    }
    checkPath(folderPath:string)   {
        folderPath = !this.isRelativePath(folderPath)?this.toRelativePath(folderPath):folderPath;
        if (!this.app.vault.adapter.exists(folderPath)) {
            throw new Error(`Fehler: Der Ordner ${folderPath} existiert nicht.`);
        }
    }
    addFolderStyles( folder : HTMLElement, visible:boolean )   {
        if(visible) {
            //console.log(`Adding Visible FolderStyles for: ${folder.tagName}${folder.hidden}`);
            folder.style.height = "";
            folder.style.display = "";
            folder.style.overflow = "";
        }
        else{   
           // console.log(`Adding Hidden FolderStyles for: ${folder.tagName}${folder.hidden}`);
            folder.style.height = "0";
            folder.style.display = "none";
            folder.style.overflow = "hidden";
        }
    }
    addFolderClassList(folder : HTMLElement,pdfFolder:boolean,imgFolder:boolean,visible:boolean)    {
        const className = this.buildClassname(pdfFolder,imgFolder,visible);
        folder.classList.add(className);
        //console.log(`Adding class: ${className}`);
    }    
    removeClassLists(folder: HTMLElement)    {
        const querySelector = this.querySelector.split(",").map(cls => cls.trim().replace(/^\./, ""));
        querySelector.forEach((cls) => {
            cls && folder.classList.remove(cls);
        });
    }
    classListIncludes(folder: HTMLElement, filterstring: string): boolean {
        const querySelector = this.querySelector
            .split(",")
            .map(value => value.trim().replace(/^\./, "")) // Bereinige Klassennamen
            .filter(value => value.includes(filterstring));
        
      //  console.log("Bereinigte QuerySelector-Klassen:", querySelector);
        //console.log("Klassennamen im Ordner:", Array.from(folder.classList));
        
        return querySelector.some(className => {
            const result = folder.classList.contains(className);
           // console.log(`Prüfe Klasse: ${className}, Enthalten: ${result}`);
            return result;
        });
    }
    buildClassname(pdfFolder:boolean,imgFolder:boolean,visible:boolean) :string {
        return `pdf-images-${pdfFolder?"pdf":""}${imgFolder?"img":""}folder${visible?"--visible":"--hidden"}`;
    }
    // Funktion zum Wiederanzeigen aller versteckten Ordner
    tempUnhideAllFolders(): void {
        const folderElements: NodeListOf<HTMLElement> = document.querySelectorAll<HTMLElement>(this.querySelector);

        folderElements.forEach((folder) => {
        if (!folder) return; 
        this.addFolderStyles(folder, true); 
        });
    }

    rehideHiddenFolders(): void {
        const folderElements: NodeListOf<HTMLElement> = document.querySelectorAll<HTMLElement>(this.querySelector);
        folderElements.forEach((folder) => {
            this.addFolderStyles(folder, !this.classListIncludes(folder,"--hidden"));
        });
    }
    
    initVisibilityByPath(folderPath :string,isPdfFolder : boolean,isImgFolder : boolean,visible : boolean)    {
        const relFolderPath = this.toRelativePath(folderPath);
        //this.checkPath(relFolderPath);
        const folderElements = this.getNodeListbyPath(relFolderPath);

        if (folderElements.length === 0) {
            throw new Error(`Fehler: Der Ordner ${relFolderPath} konnte nicht gefunden werden.`);
        }
        folderElements.forEach((folder) => {
            if (!folder)    {
                return;
            }
            this.removeClassLists(folder);
            this.addFolderClassList(folder,isPdfFolder,isImgFolder,visible);
            this.addFolderStyles(folder,visible);
        });
    }
    async initFolderArrayVisibility(folderPathArray :string[],isPdfFolderArray:boolean,isImgFolderArray:boolean,isVisibleArray:boolean):Promise<void>  {
        folderPathArray.forEach((folderPath) => {
            this.initVisibilityByPath(folderPath,isPdfFolderArray,isImgFolderArray,isVisibleArray);
        });
    }
    getNodeListByAttributes(pdfFolders:boolean,imgFolders:boolean,visible:boolean) : NodeListOf<HTMLElement> {
        const className = "." + this.buildClassname(pdfFolders,imgFolders,visible);
        return document.querySelectorAll<HTMLElement>(className);
    }
    getNodeListbyPath(relFolderPath : string) : NodeListOf<HTMLElement> {
        this.checkPath(relFolderPath);
        const normalizedPath = this.normalizeSlashes(relFolderPath,false);
        //console.log(`Normalisierter Pfad: ${normalizedPath}`);
        const query = `*[data-path="${normalizedPath}"${this.settings.CaseInsensitive ? " i" : ""}]`
        //console.log(`Query: ${query}`);
        return document.querySelectorAll<HTMLElement>(query);
    }
    getFoldersAttributes(attribute = "data-path",pdfFolders:boolean,imgFolders:boolean,visible:boolean ): string[] {
        const attributesList : string[] = []; 
        const folderElements = this.getNodeListByAttributes(pdfFolders,imgFolders,visible)
        
        //@ts-ignore
        folderElements.forEach((folder) => {
            if (!folder) return;
            const folderAttribute = folder.getAttribute(attribute);
            if (folderAttribute) {
               attributesList.push(folderAttribute);  
            }
        });
        return attributesList;
    }
    async getVisibleFolders(pdfFolders:boolean,imgFolders:boolean ): Promise<string[]> {
        return this.getFoldersAttributes("data-path",pdfFolders,imgFolders,true);
    }
    async getHiddenFolders(pdfFolders:boolean,imgFolders:boolean ): Promise<string[]> {
        return this.getFoldersAttributes("data-path",pdfFolders,imgFolders,false);
    }

} 