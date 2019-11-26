load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

exports_files([
    "package.json",
])

nodejs_binary(
    name = "testpnp",
    entry_point = ":index.js",
    data = [
        "@npm_pnp//is-number",
        "@npm_pnp//is-buffer",
        "@npm_pnp//nock",
        "@npm_pnp//closure-compiler"
    ],
    pnp_file = "@npm_pnp//:.pnp.js"
)