import { promises as fsp, WriteStream, createWriteStream } from "fs";
import * as fs from "fs";
import * as path from "path";

interface WorkspaceMetaData {
  path: string;
  yarnLock: string;
  pnpFile: PnpFile;
}
interface PackageInformation {
  packageLocation: string;
  packageDependencies: Map<string, string>;
}
interface PnpFile {
  resolveRequest: (request: string, issuer: string) => string;
  getPackageInformation: (args: {
    name: string;
    reference: string;
  }) => PackageInformation;
}

function findVersion(packageName: string, yarnLock: string) {
  packageName = packageName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(
    `(?<="?${packageName}@.*"?:\\n\\s+version\\s)"\\d+.\\d+.\\d+"`
  );
  const result = yarnLock.match(regex);
  return result ? result[0].replace(/"/g, "") : null;
}

async function writeFile(p: string, content: string) {
  await fsp.mkdir(path.dirname(p), { recursive: true });
  return fsp.writeFile(p, content);
}
/**
 * Checks if a path is an npm package which is is a directory with a package.json file.
 */
function isDirectory(p: string) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function listFiles(rootDir: string, subDir: string = ""): string[] {
  const dir = path.posix.join(rootDir, subDir);
  if (!isDirectory(dir)) {
    return [];
  }
  return (
    fs
      .readdirSync(dir)
      .reduce((files: string[], file: string) => {
        const fullPath = path.posix.join(dir, file);
        const relPath = path.posix.join(subDir, file);
        const isSymbolicLink = fs.lstatSync(fullPath).isSymbolicLink();
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch (e) {
          if (isSymbolicLink) {
            // Filter out broken symbolic links. These cause fs.statSync(fullPath)
            // to fail with `ENOENT: no such file or directory ...`
            return files;
          }
          throw e;
        }
        const isDirectory = stat.isDirectory();
        if (isDirectory && isSymbolicLink) {
          // Filter out symbolic links to directories. An issue in yarn versions
          // older than 1.12.1 creates symbolic links to folders in the .bin folder
          // which leads to Bazel targets that cross package boundaries.
          // See https://github.com/bazelbuild/rules_nodejs/issues/428 and
          // https://github.com/bazelbuild/rules_nodejs/issues/438.
          // This is tested in /e2e/fine_grained_symlinks.
          return files;
        }
        return isDirectory
          ? files.concat(listFiles(rootDir, relPath))
          : files.concat(relPath);
      }, [])
      // Files with spaces (\x20) or unicode characters (<\x20 && >\x7E) are not allowed in
      // Bazel runfiles. See https://github.com/bazelbuild/bazel/issues/4327
      .filter((f: any) => !/[^\x21-\x7E]/.test(f))
      // We return a sorted array so that the order of files
      // is the same regardless of platform
      .sort()
  );
}

function addPackageToDefs(
  packageName: string,
  location: string,
  stream: WriteStream
) {
  const sources = listFiles(location);
  stream.write(`  native.new_local_repository(
    name = "${packageName.replace(/-/g, "_")}",
    path = "${location}",
    build_file_content = """package(default_visibility = ["//visibility:public"])
filegroup(
name = "${packageName}_files",
srcs = [
  ${sources.map((f: string) => `"${f}",`).join("\n")}
]

""",
)\n`);
}

function createBinBuildFile(
  packageName: string,
  packagePath: PackageInformation
) {
  let contents = "";
  const bins = Object.keys(
    require(path.join(packagePath.packageLocation, "package.json")).bin
  );
  contents = `load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

`;
  bins.forEach(bin => {
    const data = [`//${packageName.replace(/-/g, "_")}:${packageName}`];

    contents += `# Wire up the \`bin\` entry \`${packageName}\`
      nodejs_binary(
          name = "${packageName}",
          entry_point = "@${packageName.replace(/-/g, "_")}//${bin}",
          install_source_map_support = False,
          data = [${data.map(p => `"${p}"`).join(", ")}],
      )
  `;
  });

  return writeFile(`${packageName}/bin/BUILD.bazel`, contents);
}

function createBuildFile(packageName: string, packagePath: PackageInformation) {
  const sources = listFiles(packagePath.packageLocation);
  sourceFiles = sourceFiles.concat(sources)
  let srcsStarlark = "";
  if (sources.length) {
    srcsStarlark = `
    # ${packagePath.packageLocation}
    srcs = [
        ${sources
          .map((f: string) => `"@${packageName.replace(/-/g, "_")}//:${f}",`)
          .join("\n")}
    ],`;
  }

  let contents = `load("@build_bazel_rules_nodejs//internal/npm_install:node_module_library.bzl", "node_module_library")

filegroup(
name = "${packageName}__files",${srcsStarlark}
)

node_module_library(
name = "${packageName}",
# direct sources listed for strict deps support
srcs = [":${packageName}__files"],
)
`;
  return writeFile(`${packageName}/BUILD.bazel`, contents);
}

function createDummyBuildFile(packageName: string) {
  const contents = `package(default_visibility = ["//visibility:public"])
load("@build_bazel_rules_nodejs//internal/npm_install:node_module_library.bzl", "node_module_library")
  
filegroup(
    name = "${packageName}",
    srcs = [] # we dont care about the actual content, we want a list of dependencies to modify the pnp file around
)
`;

  return writeFile(`${packageName}/BUILD.bazel`, contents);
}

function processPackage(
  packageName: string,
  metadata: WorkspaceMetaData,
  stream: WriteStream
) {
  const version = findVersion(packageName, metadata.yarnLock);
  if (!version) {
    console.log(`could not find version for package ${packageName}`);
    return Promise.resolve();
  }
  const packagePath = metadata.pnpFile.getPackageInformation({
    name: packageName,
    reference: version
  });
  const bin = require(path.join(packagePath.packageLocation, "package.json"))
    .bin;
  if (bin) {
    addPackageToDefs(packageName, packagePath.packageLocation, stream);
    createBuildFile(packageName, packagePath);
    return createBinBuildFile(packageName, packagePath);
  }
  return createDummyBuildFile(packageName);
}

let sourceFiles: string[] = [".pnp.js", "package.json"];

async function main(workspacePath: string) {
  const stream: WriteStream = createWriteStream("./defs.bzl");
  stream.write("def pinned_yarn_install():\n");
  const yarnLock = await fsp.readFile(
    path.join(workspacePath, "yarn.lock"),
    "utf-8"
  );
  const packageNameJson = require(path.join(workspacePath, "package.json"));
  const metadata: WorkspaceMetaData = {
    path: workspacePath,
    yarnLock,
    pnpFile: require(path.join(workspacePath, ".pnp.js"))
  };
  await Promise.all(
    [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies"
    ].map(d => {
      return Promise.all(
        Object.keys(packageNameJson[d] || {}).map((packageName: string) =>
          processPackage(packageName, metadata, stream)
        )
      );
    })
  );
  stream.close();
  const contents = `package(default_visibility = ["//visibility:public"])
  exports_files([ \n${sourceFiles.map(a => `${a},`).join("\n")}\n])`;
  writeFile("BUILD.bazel", contents);
}

main(process.argv[2]);
