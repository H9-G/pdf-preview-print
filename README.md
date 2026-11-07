# PDF Preview Print

**English** | [日本語](docs/README.ja.md) | [简体中文](docs/README.zh-CN.md) | [繁體中文](docs/README.zh-TW.md) | [한국어](docs/README.ko.md) | [Español](docs/README.es.md) | [Français](docs/README.fr.md) | [Deutsch](docs/README.de.md)

Preview a note as PDF pages before you save it, and print it. Choose the paper, margins and text size, colour or black and white, and keep every empty line of the note.

## Features

- **Preview**: a window shows the pages exactly as they will be in the PDF. Every change of the options updates the preview.
- **Save as PDF**: choose where each time, or save it next to the note in the vault.
- **Print**: prints with your system's print dialog.
- **Options**: paper size (A3, A4, A5, B4, B5, Letter, Legal), portrait or landscape, margins, text size, note name as title, page numbers, line numbers (off by default).
- **Colour or black and white**: black and white turns colours, highlights and pictures into grey. When printing, the printer is also set to grey.
- **Keep empty lines**: Markdown usually shows several empty lines as one gap. With this option every empty line becomes space on the page, as in the editor. It can be turned on or off in the export window and in the settings (on by default). Lists and math blocks can be included or left out (both included by default); a math block is split into separate formulas at its empty lines. Code blocks always keep their empty lines.
- **Empty lines in reading view**: reading view shows every empty line as space too, also between list items (can be turned off in the settings).
- The settings, commands and messages are available in English, Japanese, Simplified Chinese, Traditional Chinese, Korean, Spanish, French and German. The language follows Obsidian on first use and can be changed in the settings.

## How to use

- Command palette: **Preview, save or print the current note as PDF**.
- Or the **…** menu of a note, or right-click a note in the file list: **PDF preview and print**.
- Change the options on the right, then press **Save PDF** or **Print**. **Make these the default** keeps the options for next time.

## Good to know

- Desktop only (Windows, macOS, Linux).
- The PDF is made with Obsidian's light theme, your CSS snippets and the styles of your other plugins.
- If page numbers do not appear, update Obsidian by downloading the latest installer.
- Line numbers count the lines of text as they are printed, through the whole note.
- The settings tab also shows how to open the preview.

## Files and network

- The plugin reads the note you export. It saves the PDF only where you choose, or next to the note when that option is set; a PDF of the same name there is replaced.
- It uses Electron, the base of the Obsidian desktop app, to make the PDF, to print and to show the save dialog.
- When you choose the place each time, the PDF is written with Node.js's file module (fs), only to the file you picked in the save dialog. Nothing else on your computer is read or written. To keep everything inside the vault, set the save place to "Next to the note".
- No network use. The plugin works offline and collects no data.

## License

MIT
