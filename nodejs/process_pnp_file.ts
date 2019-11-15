import * as fs from 'fs';
import * as process from 'process';
if (require.main === module) {
  main();
}

/**
 * Main entrypoint.
 */
function main() {
  const pnpFile = fs.readFileSync("./.pnp.js", "utf8")
  const patchedPnpFile = pnpFile.replace("issuerModule ? issuerModule.filename : `${process.cwd()}/`;", `"${process.cwd()}"`)
  fs.writeFileSync("./.pnp.js", patchedPnpFile, "utf8")
}