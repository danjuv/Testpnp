import * as fs from "fs";
import * as process from "process";
import * as path from "path";
if (require.main === module) {
  main(process.argv[2]);
}

/**
 * This patches a PnP file to force the resolver to resolve from the repository's directory
 * not the entry_point's directory. PnP assumes they are the same so when bazel creates the
 * pnp file in a different directory, the pnp files can't resolve the paths.
 */
function main(workspacePath: string) {
  const pnpPath = path.join(workspacePath, ".pnp.js");
  const pnpFile = fs.readFileSync(pnpPath, "utf8");
  /**
   * match the line in .pnp.js that defines the workspace to start looking for the yarn dependencies.
   * .pnp.js specifically uses relativistic paths, so we must look for the dependencies from the same
   * directory as where yarn_install was called
   */

  const patchedPnpFile = pnpFile.replace(
    "issuerModule ? issuerModule.filename : `${process.cwd()}/`;",
    JSON.stringify(process.cwd())
  );
  fs.writeFileSync("./.pnp.js", patchedPnpFile, "utf8");
}
