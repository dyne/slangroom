import path, { dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createSyntaxDiagramsCode } from "@slangroom/deps/chevrotain"
import {wallet} from "@slangroom/wallet"
import {http} from "@slangroom/http"
import {ethereum} from "@slangroom/ethereum"
import {Slangroom} from "@slangroom/core"

const __dirname = dirname(fileURLToPath(import.meta.url));

const genereateDocs = (name, plugin) => {
    const parserInstance = new Slangroom([plugin]).getParser()
    const serializedGrammar = parserInstance.getSerializedGastProductions();

    // create the HTML Text
    const htmlText = createSyntaxDiagramsCode(serializedGrammar);

    // Write the HTML file to disk
    const outPath = path.resolve(__dirname, "./");
    fs.writeFileSync(outPath + `/${name}.html`, htmlText);
}

[
    ["wallet", wallet],
    ["ethereum", ethereum],
    ["http", http ],
].map(x => genereateDocs(x[0], x[1]))
