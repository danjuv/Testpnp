"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
function findPackages() {
}
async function main() {
    const pnpFile = process.argv.slice(2)[0];
    const pnp = require(pnpFile);
    const result = pnp.resolveRequest("is-number", "/Users/danju/work/testpnp/pnp/");
    console.log(path.dirname(result));
}
main();
