import * as fs from 'fs';
import * as process from 'process';
import * as path from 'path';
if (require.main === module) {
  main();
}

/**
 * Main entrypoint.
 */
function main() {
  const workspacePath = process.argv.slice(2)[0];

  const pnpPath = path.join(workspacePath, ".pnp.js")
  const pnpFile = fs.readFileSync(pnpPath, "utf8");
  const patchedPnpFile = pnpFile.replace("issuerModule ? issuerModule.filename : `${process.cwd()}/`;", `"${process.cwd()}"`);
  fs.writeFileSync("./.pnp.js", patchedPnpFile, "utf8");
}