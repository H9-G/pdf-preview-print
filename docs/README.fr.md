# PDF Preview Print

[English](../README.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [Español](README.es.md) | **Français** | [Deutsch](README.de.md)

Prévisualisez une note sous forme de pages PDF avant de l'enregistrer, et imprimez-la. Choisissez le papier, les marges et la taille du texte, la couleur ou le noir et blanc, et gardez chaque ligne vide de la note.

## Fonctionnalités

- **Aperçu** : une fenêtre montre les pages exactement comme dans le PDF. Chaque changement d'option met l'aperçu à jour.
- **Enregistrer en PDF** : choisissez l'emplacement à chaque fois, ou enregistrez-le à côté de la note dans le coffre.
- **Imprimer** : imprime avec la boîte de dialogue d'impression du système.
- **Options** : format du papier (A3, A4, A5, B4, B5, Letter, Legal), portrait ou paysage, marges, taille du texte, nom de la note comme titre, numéros de page, numéros de ligne (désactivés par défaut).
- **Couleur ou noir et blanc** : en noir et blanc, les couleurs, surlignages et images deviennent gris. À l'impression, l'imprimante est aussi réglée en gris.
- **Garder les lignes vides** : Markdown affiche généralement plusieurs lignes vides comme un seul espace. Avec cette option, chaque ligne vide devient un espace sur la page, comme dans l'éditeur. Elle peut être activée ou désactivée dans la fenêtre d'export et dans les réglages (activée par défaut). Les listes et les blocs mathématiques peuvent être inclus ou non (inclus par défaut) ; un bloc mathématique est coupé en formules séparées à ses lignes vides. Les blocs de code gardent toujours leurs lignes vides.
- **Lignes vides en mode lecture** : le mode lecture affiche aussi chaque ligne vide comme un espace, y compris entre les éléments de liste (désactivable dans les réglages).
- Les réglages, commandes et messages sont disponibles en anglais, japonais, chinois simplifié, chinois traditionnel, coréen, espagnol, français et allemand. La langue suit celle d'Obsidian au premier lancement et peut être changée dans les réglages.

## Utilisation

- Palette de commandes : **Prévisualiser, enregistrer ou imprimer la note en PDF**.
- Ou le menu **…** d'une note, ou un clic droit sur une note dans la liste des fichiers : **Aperçu PDF et impression**.
- Changez les options à droite, puis appuyez sur **Enregistrer le PDF** ou **Imprimer**. **Utiliser par défaut** garde les options pour la prochaine fois.

## Bon à savoir

- Uniquement sur ordinateur (Windows, macOS, Linux).
- Le PDF est créé avec le thème clair d'Obsidian, vos extraits CSS et les styles de vos autres plugins.
- Si les numéros de page n'apparaissent pas, mettez Obsidian à jour en téléchargeant le dernier installateur.
- Les numéros de ligne comptent les lignes de texte telles qu'elles sont imprimées, sur toute la note.
- L'onglet des réglages indique aussi comment ouvrir l'aperçu.

## Fichiers et réseau

- Le plugin lit la note que vous exportez. Il enregistre le PDF uniquement à l'endroit choisi, ou à côté de la note si cette option est réglée ; un PDF du même nom y est remplacé.
- Il utilise Electron, la base de l'application de bureau Obsidian, pour créer le PDF, imprimer et afficher la boîte d'enregistrement.
- Si vous choisissez l'emplacement à chaque fois, le PDF est écrit avec le module de fichiers de Node.js (fs), uniquement dans le fichier choisi dans la boîte d'enregistrement. Aucun autre fichier de votre ordinateur n'est lu ni écrit. Pour tout garder dans le coffre, choisissez « À côté de la note » comme emplacement.
- Aucune utilisation du réseau. Le plugin fonctionne hors ligne et ne collecte aucune donnée.

## Licence

MIT
