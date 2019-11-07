load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

exports_files([
    "package.json",
])


nodejs_binary(
    name = "testyarn",
    data = ["@npm_yarn//is-number"],
    entry_point = ":index.js",
)

nodejs_binary(
    name = "testpnp",
    entry_point = ":index.js",
    data = ["@npm_pnp//:.pnp.js"],
    args = ["-r $(execpath @npm_pnp//:.pnp.js)"],
)