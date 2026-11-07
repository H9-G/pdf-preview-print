// The small part of Electron that this plugin uses. Obsidian's desktop app provides the module at run time.
declare module "electron" {
  interface SaveDialogResult {
    canceled: boolean;
    filePath?: string;
  }
  export const remote: {
    dialog: {
      showSaveDialog(options: {
        title?: string;
        defaultPath?: string;
        filters?: { name: string; extensions: string[] }[];
      }): Promise<SaveDialogResult>;
    };
    shell: { openPath(path: string): Promise<string> };
  };
}
