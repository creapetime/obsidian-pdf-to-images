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
    importSize : number;
    imgSafeFolder: string;
    pdfSaveFolder: string;
    bundleImgFiles: boolean;
    copyPdf: boolean;
    copyImgs: boolean;
    deletePdf:boolean;
    deleteImgs:boolean;
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
    importSize : 1000,
    imgSafeFolder : "",
    pdfSaveFolder: "",
    bundleImgFiles: true,
    copyPdf: false,
    copyImgs: false,
    deletePdf: false,
    deleteImgs: true,
  };