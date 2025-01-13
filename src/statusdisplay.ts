import { App, Notice, Plugin, PluginManifest} from 'obsidian';

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
       // this.updatePageStatus(2,100);
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
        this.hideStatusBars();
        if (this.statusBarItemStat) {
            this.statusBarItemStat.style.display = 'none';
            this.statusBarItemStat.remove();
            this.statusBarItemStat = null; 
        }
    
        if (this.statusBarItemProg) {
            this.statusBarItemProg.style.display = 'none';
            this.statusBarItemProg.remove();
            this.statusBarItemProg = null;
        }
    }

}