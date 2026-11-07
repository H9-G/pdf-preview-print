# PDF Preview Print

[English](../README.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | **Deutsch**

Sieh dir eine Notiz als PDF-Seiten an, bevor du sie speicherst, und drucke sie. Wähle Papier, Ränder und Textgröße, Farbe oder Schwarzweiß, und behalte jede Leerzeile der Notiz.

## Funktionen

- **Vorschau**: Ein Fenster zeigt die Seiten genau so, wie sie im PDF sein werden. Jede Änderung der Optionen aktualisiert die Vorschau.
- **Als PDF speichern**: Wähle jedes Mal den Ort, oder speichere sie neben der Notiz im Tresor.
- **Drucken**: Druckt über den Druckdialog des Systems.
- **Optionen**: Papierformat (A3, A4, A5, B4, B5, Letter, Legal), Hoch- oder Querformat, Ränder, Textgröße, Notizname als Titel, Seitenzahlen, Zeilennummern (standardmäßig aus).
- **Farbe oder Schwarzweiß**: Schwarzweiß macht Farben, Hervorhebungen und Bilder grau. Beim Drucken wird auch der Drucker auf Graustufen gestellt.
- **Leerzeilen behalten**: Markdown zeigt mehrere Leerzeilen meist als einen Abstand. Mit dieser Option wird jede Leerzeile zu Abstand auf der Seite, wie im Editor. Sie lässt sich im Exportfenster und in den Einstellungen ein- und ausschalten (standardmäßig an). Listen und Mathe-Blöcke können einbezogen werden oder nicht (standardmäßig beide); ein Mathe-Block wird an seinen Leerzeilen in getrennte Formeln geteilt. Codeblöcke behalten ihre Leerzeilen immer.
- **Leerzeilen in der Leseansicht**: Auch die Leseansicht zeigt jede Leerzeile als Abstand, auch zwischen Listeneinträgen (in den Einstellungen abschaltbar).
- Einstellungen, Befehle und Meldungen gibt es auf Englisch, Japanisch, vereinfachtem Chinesisch, traditionellem Chinesisch, Koreanisch, Spanisch, Französisch und Deutsch. Die Sprache folgt beim ersten Start Obsidian und kann in den Einstellungen geändert werden.

## Verwendung

- Befehlspalette: **Aktuelle Notiz als PDF ansehen, speichern oder drucken**.
- Oder das **…**-Menü einer Notiz, oder Rechtsklick auf eine Notiz in der Dateiliste: **PDF-Vorschau und Drucken**.
- Ändere rechts die Optionen und drücke dann **PDF speichern** oder **Drucken**. **Als Standard verwenden** behält die Optionen für das nächste Mal.

## Gut zu wissen

- Nur für den Desktop (Windows, macOS, Linux).
- Das PDF wird mit dem hellen Design von Obsidian, deinen CSS-Snippets und den Stilen deiner anderen Plugins erstellt.
- Wenn keine Seitenzahlen erscheinen, aktualisiere Obsidian mit dem neuesten Installationsprogramm.
- Zeilennummern zählen die Textzeilen so, wie sie gedruckt werden, durch die ganze Notiz.
- Der Einstellungs-Tab zeigt auch, wie man die Vorschau öffnet.

## Dateien und Netzwerk

- Das Plugin liest die Notiz, die du exportierst. Es speichert die PDF nur dort, wo du es wählst, oder neben der Notiz, wenn das eingestellt ist; eine PDF mit gleichem Namen wird dort ersetzt.
- Es nutzt Electron, die Grundlage der Obsidian-Desktop-App, um die PDF zu erstellen, zu drucken und den Speicherdialog zu zeigen.
- Keine Netzwerknutzung. Das Plugin funktioniert offline und sammelt keine Daten.

## Lizenz

MIT
