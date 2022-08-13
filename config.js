import { readFile, writeFile } from "fs/promises";
const config = JSON.parse((await readFile("config.json")).toString());
function saveConfig() {
    return writeFile("config.json", JSON.stringify(config));
}
export default config;
export { saveConfig };
