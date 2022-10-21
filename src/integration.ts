import {generateIntegrationFile} from "./utils/integration";

(async () => {
    console.log("Generating hash list for integration purpose...");
    await generateIntegrationFile();
    console.log("Hash list file generated!");
})();