import * as fs from 'fs';
import * as path from 'path';

function findPackages() {

}

function mkdirp(p: any) {
  if (!fs.existsSync(p)) {
      mkdirp(path.dirname(p));
      fs.mkdirSync(p);
  }
}

function writeFileSync(p: any, content: any) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, content);
}

function generateBuildFile(pkg: string) {
  const result = path.dirname(pnp.resolveRequest("is-number", "."))
  const contents = `
  package(default_visibility = ["//visibility:public"])
  new_local_repository(
    name = "is-number",
    path = "${result}",
    build_file = "BUILD.isnumber",
)
  filegroup(
    name = "is-number__files",
    srcs = glob(["//is-number/*"]),
  )
  `
  writeFileSync(`is-number/BUILD.bazel`, contents);
}

async function main() {

  const pkgs = ["is-number"];

  generateBuildFile(pkgs[0])
}

const pnpFile = "./.pnp.js";
const pnp = require(pnpFile)

main()