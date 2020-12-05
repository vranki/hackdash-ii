import { NoEmitOnErrorsPlugin } from "webpack";

function createLocalSettings() {
    return {
        "roomToView": "!matrix_room_id:matrix.server",
        "title": "Title for the page",
        // "logo": "https://url.to/image.jpg",    // Optional
        "matrixUser": "@user:matrix.server", // Not used yet
        "matrixAccessToken": "MDAxOGlotofcharacters_fqy4yRQo", // Not used yet
        "matrixServer": "https://matrix.server", // Not used yet
        "showTemperature": false,
        "showLights": false,
        "showPrinter": false,
        "showBuses": false
    }
}

export const localsettings = createLocalSettings();
