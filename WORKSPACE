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
    patches = ["//nodejs:yarn_install.patch", "//nodejs:pnp_install.patch"],
    sha256 = "c612d6b76eaa17540e8b8c806e02701ed38891460f9ba3303f4424615437887a",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/0.42.1/rules_nodejs-0.42.1.tar.gz"],
)
http_archive(
    name = "bazel_json",
    sha256 = "a57a6f794943548fde6da8ec3edad88af89436e8102f33d8f6135202699847f4",
    urls = ["https://github.com/erickj/bazel_json/archive/e954ef2c28cd92d97304810e8999e1141e2b5cc8.tar.gz"],
)
 
load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories", "yarn_install")
node_repositories(preserve_symlinks=False,)





yarn_install(
  name = "npm_pnp",
  package_json = "//pnp:package.json",
  yarn_lock = "//pnp:yarn.lock",
  symlink_node_modules = False,
)

load("@npm_pnp//:defs.bzl", "pinned_yarn_install")
pinned_yarn_install()