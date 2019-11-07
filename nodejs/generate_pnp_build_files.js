"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function findPackages() {
}
function mkdirp(p) {
    if (!fs.existsSync(p)) {
        mkdirp(path.dirname(p));
        fs.mkdirSync(p);
    }
}
function writeFileSync(p, content) {
    mkdirp(path.dirname(p));
    fs.writeFileSync(p, content);
}
function generateBuildFile(pkg) {
    const result = path.dirname(pnp.resolveRequest(pkg, "."));
    const contents = `
  package(default_visibility = ["//visibility:public"])
  new_local_repository(
    name = "${pkg}",
    path = "${result}",
    build_file = "BUILD.isnumber",
)
  filegroup(
    name = "is-number__files",
    srcs = glob(["//${pkg}/*"]),
  )
  `;
    writeFileSync(`${pkg}/BUILD.bazel`, contents);
}
async function main() {
    const pkgs = ["is-number"];
    generateBuildFile(pkgs[0]);

    const contents = `
package(default_visibility = ["//visibility:public"])

exports_files([
    ".pnp.js",
])
    `
    writeFileSync(`BUILD.bazel`, contents);
}
const pnpFile = "./.pnp.js";
const pnp = require(pnpFile);
main();
