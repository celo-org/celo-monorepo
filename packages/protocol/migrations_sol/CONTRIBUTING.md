# Anvil migrations 

The "Anvil migrations" are a set of scripts that generate a local anvil-based devchain. 
This devchain is useful for testing and development of the Celo protocol.

## Usage

### Start L1 devchain

```sh
$ yarn anvil-devchain:start-L1
``` 

Starts a new anvil devchain serving at localhost (default port 8546).

You can now run commands against the local devchain. For example:

```sh
cast block-number \
--rpc-url http://127.0.0.1:8546
266
```

### Start L2 devchain

```sh
$ yarn anvil-devchain:start-L2
``` 

Starts a new anvil devchain serving at localhost (default port 8546).

You can now run commands against the local devchain. For example:

```sh
# Call `isL2()` on `CeloUnreleasedTreasure.sol`
cast call \
0xA16cF67AFa80BB9Ce7a325597F80057c6B290fD4 \
"isL2()(bool)" \
--rpc-url=http://127.0.0.1:8546
true
```

### Check if devchain is running

```sh
$ yarn anvil-devchain:status

# If devchain is running
Devchain is serving at http://localhost:8546

# If devchain is not running
Devchain is not running.
```

### Stop devchain

```sh
$ yarn anvil-devchain:stop
```

Terminates any anvil nodes serving at localhost. For example:

```sh
$ yarn anvil-devchain:stop

Killed Anvil
```