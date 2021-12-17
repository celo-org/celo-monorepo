# `celocli plugins`

list installed plugins


## `celocli plugins`

list installed plugins

```
list installed plugins

USAGE
  $ celocli plugins

OPTIONS
  --core  show core plugins

EXAMPLE
  $ celocli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.9.5/src/commands/plugins/index.ts)_

## `celocli plugins:install PLUGIN...`

installs a plugin into the CLI

```
installs a plugin into the CLI
Can be installed from npm or a git url.

Installation of a user-installed plugin will override a core plugin.

e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in the CLI without the need to patch and update the whole CLI.


USAGE
  $ celocli plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  plugin to install

OPTIONS
  -f, --force    yarn install with force flag
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed
  plugin with a 'hello' command will override the core plugin implementation. This is
  useful if a user needs to update core plugin functionality in the CLI without the need
  to patch and update the whole CLI.


ALIASES
  $ celocli plugins:add

EXAMPLES
  $ celocli plugins:install myplugin

  $ celocli plugins:install https://github.com/someuser/someplugin

  $ celocli plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.9.5/src/commands/plugins/install.ts)_

## `celocli plugins:link PLUGIN`

links a plugin into the CLI for development

```
links a plugin into the CLI for development
Installation of a linked plugin will override a user-installed or core plugin.

e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello' command will override the user-installed or core plugin implementation. This is useful for development work.


USAGE
  $ celocli plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command,
  installing a linked plugin with a 'hello' command will override the user-installed or
  core plugin implementation. This is useful for development work.


EXAMPLE
  $ celocli plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.9.5/src/commands/plugins/link.ts)_

## `celocli plugins:uninstall PLUGIN...`

removes a plugin from the CLI

```
removes a plugin from the CLI

USAGE
  $ celocli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ celocli plugins:unlink
  $ celocli plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.9.5/src/commands/plugins/uninstall.ts)_

## `celocli plugins:update`

update installed plugins

```
update installed plugins

USAGE
  $ celocli plugins:update

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.9.5/src/commands/plugins/update.ts)_
