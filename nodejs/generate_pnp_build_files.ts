import * as fs from 'fs';
import * as path from 'path';

function findPackages() {

}

async function main() {
  const pnpFile = process.argv.slice(2)[0];
  const pnp = require(pnpFile)
  const result = pnp.resolveRequest("is-number", "/Users/danju/work/testpnp/pnp/")
  console.log(path.dirname(result));
}
main()