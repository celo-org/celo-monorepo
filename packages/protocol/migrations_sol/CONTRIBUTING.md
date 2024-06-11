# Anvil migrations 

The "Anvil migrations" are a set of scripts that generate a local anvil-based devchain. 
This devchain is useful for testing and development of the Celo protocol.

## Usage

### Start devchain

```sh
$ yarn anvil-devchain:start
``` 

Starts a new anvil devchain serving at localhost (default port 8546).

For example:

```sh
$ yarn anvil-devchain:start

yarn run v1.22.22
$ ./scripts/foundry/create_and_migrate_anvil_devchain.sh
# ...
Total elapsed time: 193 seconds
✨  Done in 193.09s.
```

You can now run commands against the local devchain.

For example:

```sh
cast block-number \
--rpc-url http://127.0.0.1:8546
266
```

### Stop devchain

```sh
$ yarn anvil-devchain:stop
```

Terminates any anvil nodes serving at localhost.

For example:

```sh
# in packages/protocol/ directory
$ yarn anvil-devchain:stop

yarn run v1.22.22
$ ./scripts/foundry/stop_anvil.sh
Connection to localhost port 8546 [tcp/*] succeeded!
Killed Anvil
✨  Done in 0.11s.
```