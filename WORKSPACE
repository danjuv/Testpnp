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
    sha256 = "3d7296d834208792fa3b2ded8ec04e75068e3de172fae79db217615bd75a6ff7",
    patches = ["//nodejs:yarn_install.patch"],
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/0.39.1/rules_nodejs-0.39.1.tar.gz"],
)
# 
load("@build_bazel_rules_nodejs//:defs.bzl", "yarn_install")
load("//nodejs:pnp_install.bzl", "pnp_install")
# load("//tools/build/nodejs:download_yarn.bzl", "download_yarn")
# load("//pnp:yarn_install.bzl", "yarn_install")
# download_yarn(name = "downloaded_yarn")
load("@build_bazel_rules_nodejs//internal/node:node_repositories.bzl", _node_repositories = "node_repositories")
# load("@downloaded_yarn//:install_yarn.bzl", "install_yarn")
# install_yarn()
_node_repositories()
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