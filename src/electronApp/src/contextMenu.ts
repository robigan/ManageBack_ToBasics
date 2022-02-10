// Some of the code is of copyright holder Sindre Sorhus (MIT License)

import { } from "electron"; // Ts complains if I don't have this import statement
import { BrowserWindow, Menu, dialog } from "electron/main";
import { createWriteStream } from "node:fs";
import { get } from "node:https";
import { setTimeout } from "node:timers/promises";

import { EditFlagsContext } from "../types/contextMenu";
import { development } from "./helper";

const setupContextMenu = (browserWindow: BrowserWindow) => {
    const webContents = browserWindow.webContents;

    webContents.on("context-menu", (event, params) => {
        const hasText = params.selectionText.trim().length > 0;
        // const isLink = !!params.linkURL;
        const can = (type: EditFlagsContext) => params.editFlags[`can${type}`] && hasText;
        // params.editFlags[""]

        /**
         * @type {...[import("electron/main").MenuItemConstructorOptions]}
         */
        const template = [
            {
                label: "Do Something",
                click: async () => {
                    development ? console.trace("I have been clicked!") : undefined;
                }
            },
            {
                label: "Cu&t",
                enabled: can("Cut"),
                visible: params.isEditable,
                async click() {
                    webContents.cut();
                }
            },
            {
                label: "&Copy",
                enabled: can("Copy"),
                visible: params.isEditable || hasText,
                async click() {
                    webContents.copy();
                }
            },
            {
                label: "&Paste",
                enabled: can("Paste"),
                visible: params.isEditable,
                async click() {
                    webContents.paste();
                }
            },
            {
                label: "Save I&mage",
                visible: params.mediaType === "image",
                async click() {
                    // I am lazy af
                    const srcURLLastSlash = params.srcURL.split("/");
                    const srcURLFilename = srcURLLastSlash[srcURLLastSlash.length - 1].split("?")[0];

                    const {canceled, filePath} = await dialog.showSaveDialog(browserWindow, {title: `Save File ${srcURLFilename}`});



                    if (!canceled && filePath !== undefined) {
                        // const handle = await open(filePath, "w", 0o644);
                        const writeStream = createWriteStream(filePath, {
                            mode: 0o644
                        });

                        get(params.srcURL, (response) => {
                            response.pipe(writeStream);

                            writeStream.close();

                            console.log("Done writing");
                        });

                        
                        await setTimeout(30000); // To push the downoad to a global array that can be accessed by menuBar so that the user can manage downloads

                        writeStream.close();
                    } else {
                        // Throw error modal to user
                    }
                }
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        menu.popup({ window: browserWindow });
    });
};

// module.exports = {
//     setupContextMenu
// };

export { setupContextMenu };