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
    imgSaveFolder: string;
    pdfSaveFolder: string;
    bundleImgFiles: boolean;
    copyPdf: boolean;
    copyImgs: boolean;
    deletePdf:boolean;
    deleteImgs:boolean;
    hideImgSaveFolder:boolean;
    hidePdfSaveFolder : boolean;
    hiddenPdfFolders : string[],
    hiddenImgFolders : string[],
    visiblePdfFolders : string[],
    visibleImgFolders : string[],
    hiddenFolders : string[],
    visibleFolders : string[],

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
    importSize: 1000,
    imgSaveFolder: "",
    pdfSaveFolder: "",
    bundleImgFiles: true,
    copyPdf: false,
    copyImgs: false,
    deletePdf: false,
    deleteImgs: true,
    hideImgSaveFolder: false,
    hidePdfSaveFolder: false,
    hiddenPdfFolders : [],
    hiddenImgFolders : [],
    visiblePdfFolders : [],
    visibleImgFolders : [],
    hiddenFolders : [],
    visibleFolders : [],
  };