import { promises as fsp } from "fs";
import * as path from "path";
import * as builder from './generate_build_file'

interface PackageData {
  packageJson: {
    bin: { [key: string]: string },
    dependencies: { [key: string]: string },
    devDependencies: { [key: string]: string },
    peerDependencies: { [key: string]: string },
    optionalDependencies: { [key: string]: string } 
  };
  pnpFile: {
    resolveRequest: (request: string, issuer: string) => string;
    getPackageInformation: (args: {
      name: string;
      reference: string;
    }) => PnpPackageInformation;
  };
  yarnLock: string;
}

interface PnpPackageInformation {
  packageLocation: string;
  packageDependencies: Map<string, string>;
}
async function writeFile(p: string, content: string) {
  await fsp.mkdir(path.dirname(p), { recursive: true })
  return fsp.writeFile(p, content);
}

function createBuildFile(packageName: string) {
  const contents = `package(default_visibility = ["//visibility:public"])
load("@build_bazel_rules_nodejs//internal/npm_install:node_module_library.bzl", "node_module_library")

filegroup(
    name = "${packageName}",
    srcs = [] # we dont care about the actual content, we want a list of dependencies to modify the pnp file around
)
`;

  return writeFile(`${packageName}/BUILD.bazel`, contents);
}

function findVersion(packageName: string, yarnLock: string) {
  packageName = packageName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(
    `(?<="?${packageName}@.*"?:\\n\\s+version\\s)"\\d+.\\d+.\\d+"`
  );
  const result = yarnLock.match(regex);
  return result ? result[0].replace(/"/g, "") : null;
}

function processPackage(packageName: string, data: PackageData) {
  const packageVersion = findVersion(packageName, data.yarnLock);
  if(!packageVersion) {
    return
  }
  const packageInfo = data.pnpFile.getPackageInformation({name: packageName, reference: packageVersion})
  const packageLocation = packageInfo.packageLocation
  const parsedPackage = builder.parsePackage(packageLocation);
  builder.generatePackageBuildFiles(parsedPackage);
  return Promise.resolve();
  // return createBuildFile(packageName);
}


async function main(workspacePath: string) {
  const contents = `package(default_visibility = ["//visibility:public"])
exports_files([
    ".pnp.js",
    "package.json",
])`;
  const packageData = {
    packageJson: require(path.join(workspacePath, "package.json")),
    pnpFile: require(path.join(workspacePath, ".pnp.js")),
    yarnLock: await fsp.readFile(path.join(workspacePath, "yarn.lock"), "utf-8"),
  }

  await Promise.all(
    [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies"
    ].map(d => {
      return Promise.all(
        Object.keys(packageData.packageJson[d] || {})
          .map((d) => processPackage(d, packageData))
          .concat([writeFile("BUILD.bazel", contents)])
      );
    })
  );
}

main(process.argv[2]);
