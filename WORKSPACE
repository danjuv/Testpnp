workspace(name = "testpnp")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "bazel_skylib",
    sha256 = "ba5d15ca230efca96320085d8e4d58da826d1f81b444ef8afccd8b23e0799b52",
    strip_prefix = "bazel-skylib-f83cb8dd6f5658bc574ccd873e25197055265d1c",
    url = "https://github.com/bazelbuild/bazel-skylib/archive/f83cb8dd6f5658bc574ccd873e25197055265d1c.tar.gz",
)

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "9901bc17138a79135048fb0c107ee7a56e91815ec6594c08cb9a17b80276d62b",
    patches = ["//nodejs:yarn_install.patch"],
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/0.40.0/rules_nodejs-0.40.0.tar.gz"],
)

http_archive(
    name = "build_bazel_rules_nodejs_yarn",
    sha256 = "9901bc17138a79135048fb0c107ee7a56e91815ec6594c08cb9a17b80276d62b",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/0.40.0/rules_nodejs-0.40.0.tar.gz"],
)
# 
load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories")
load("@build_bazel_rules_nodejs_yarn//:defs.bzl", "yarn_install")
load("//nodejs:pnp_install.bzl", "pnp_install")
node_repositories(preserve_symlinks=False,)
yarn_install(
  name = "npm_yarn",
  package_json = "//pnp:package.json",
  yarn_lock = "//pnp:yarn.lock",
  symlink_node_modules = False,
)
pnp_install(
  name = "npm_pnp",
  package_json = "//pnp:package.json",
  yarn_lock = "//pnp:yarn.lock",
  symlink_node_modules = False,
)
load("@npm_pnp//:defs.bzl", "pinned_yarn_install")
pinned_yarn_install()