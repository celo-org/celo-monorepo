# packages/dev-utils

This is a `utils` package that is meant to be used as a devDependency. It's primary use case is to reuse the ganache setup currently present in `cli` and `contractkit`. Due to the way jest uses globalSetup, depending packages will still need to define their own setup/teardown files.
