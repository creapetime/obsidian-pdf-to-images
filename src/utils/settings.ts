export interface ConvertSettings {
    preserveAspectRatio: boolean;
    quality : number;
    density: number;
    width:  number;
    height: number;
    format: string;
    compression: string;
    saveFilename: string;
    savePath: string;
    importsize : number;
  }
  
  export const DEFAULT_SETTINGS: ConvertSettings = {
    preserveAspectRatio: true,
    quality: 100,
    density: 600,
    width:  1920,
    height: 1080,
    format: "png",
    compression: "jpeg",
    saveFilename: 'untitled',
    savePath: './',
    importsize : 1000,
  };