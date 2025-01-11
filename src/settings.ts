export interface ConvertPluginSettings {
    myOption: boolean; // Beispieloption
    anotherOption: string; // Weitere Option
  }
  
  export const DEFAULT_SETTINGS: ConvertPluginSettings = {
    myOption: true,
    anotherOption: 'default value',
  };