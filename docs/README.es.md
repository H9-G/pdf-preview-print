# PDF Preview Print

[English](../README.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | **Español** | [Français](README.fr.md) | [Deutsch](README.de.md)

Previsualiza una nota como páginas PDF antes de guardarla, e imprímela. Elige el papel, los márgenes y el tamaño del texto, color o blanco y negro, y conserva cada línea vacía de la nota.

## Funciones

- **Vista previa**: una ventana muestra las páginas tal como serán en el PDF. Cada cambio de las opciones actualiza la vista previa.
- **Guardar como PDF**: elige dónde cada vez, o guárdalo junto a la nota en la bóveda.
- **Imprimir**: imprime con el diálogo de impresión del sistema.
- **Opciones**: tamaño del papel (A3, A4, A5, B4, B5, Letter, Legal), vertical u horizontal, márgenes, tamaño del texto, nombre de la nota como título, números de página, números de línea (desactivados por defecto).
- **Color o blanco y negro**: en blanco y negro, los colores, resaltados e imágenes pasan a gris. Al imprimir, la impresora también se ajusta a gris.
- **Conservar las líneas vacías**: Markdown suele mostrar varias líneas vacías como un solo espacio. Con esta opción, cada línea vacía se convierte en espacio en la página, como en el editor. Se puede activar o desactivar en la ventana de exportación y en los ajustes (activada por defecto). Se puede elegir si incluir listas y bloques de matemáticas (ambos incluidos por defecto); un bloque de matemáticas se divide en fórmulas separadas en sus líneas vacías. Los bloques de código siempre conservan sus líneas vacías.
- **Vista de lectura**: las opciones que muestran las líneas vacías y la sangría en la vista de lectura son ahora un plugin propio, [Editor-like Reading View](https://github.com/H9-G/editor-like-reading-view), que también funciona en móvil.
- **Conservar la sangría**: las líneas sangradas con espacios o tabulaciones mantienen la sangría en el PDF, como en el editor, en lugar de convertirse en código. Las listas no cambian. Se puede desactivar en los ajustes y en la ventana de exportación.
- Los ajustes, comandos y mensajes están disponibles en inglés, japonés, chino simplificado, chino tradicional, coreano, español, francés y alemán. El idioma sigue al de Obsidian la primera vez y se puede cambiar en los ajustes.

## Cómo se usa

- Paleta de comandos: **Previsualizar, guardar o imprimir la nota actual como PDF**.
- O el menú **…** de una nota, o clic derecho en una nota de la lista de archivos: **Vista previa e impresión en PDF**.
- Cambia las opciones de la derecha y pulsa **Guardar PDF** o **Imprimir**. **Usar como predeterminado** conserva las opciones para la próxima vez.

## Conviene saber

- Solo para escritorio (Windows, macOS, Linux).
- El PDF se crea con el tema claro de Obsidian, tus fragmentos CSS y los estilos de tus otros plugins.
- Si no aparecen los números de página, actualiza Obsidian descargando el instalador más reciente.
- Los números de línea cuentan las líneas de texto tal como se imprimen, a lo largo de toda la nota.
- La pestaña de ajustes también explica cómo abrir la vista previa.

## Archivos y red

- El plugin lee la nota que exportas. Guarda el PDF solo donde tú elijas, o junto a la nota si esa opción está activada; allí se reemplaza un PDF con el mismo nombre.
- Usa Electron, la base de la aplicación de escritorio de Obsidian, para crear el PDF, imprimir y mostrar el diálogo de guardado.
- Si eliges el lugar cada vez, el PDF se escribe con el módulo de archivos de Node.js (fs), solo en el archivo que elegiste en el diálogo de guardado. No se lee ni se escribe ningún otro archivo de tu ordenador. Para hacerlo todo dentro de la bóveda, elige «Junto a la nota» como lugar de guardado.
- No usa la red. El plugin funciona sin conexión y no recopila datos.

## Licencia

MIT
