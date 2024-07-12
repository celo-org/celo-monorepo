# @celo/devchain-anvil

This package contains anvil state that allows you to start an [anvil](https://book.getfoundry.sh/reference/anvil/) instance in seconds.

This anvil instance serves at `localhost:8545` on your machine, and comes pre-configured with core contracts like the [`Registry`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Registry.sol) contract (at `0x000000000000000000000000000000000000ce10`). You can make RPC calls against this anvil instance as if you were interacting with Celo on `Alfajores` or `Mainnet`.

## Usage

```bash
npm install --save-dev @celo/devchain-anvil
anvil --state <path_to_devchain.json>
```

Files in this package:

1. Use `devchain.json` for a Celo L1-like devchain.
1. Use `l2-devchain.json` for a Celo L2-like devchain.

### Example

1.  Make a test directory

    ```sh
    # Create a demo directory
    $ mkdir ~/Documents/local-anvil-demo

    # Move into the demo directory
    $ cd ~/Documents/local-anvil-demo
    ```

2.  Install the package

    ```sh
    $ npm install --save-dev @celo/devchain-anvil
    ```

3.  Start an anvil instance with the state file from the package

    ```sh
    $ anvil --state node_modules/@celo/devchain-anvil/devchain.json

                                 _   _
                                (_) | |
          __ _   _ __   __   __  _  | |
         / _` | | '_ \  \ \ / / | | | |
        | (_| | | | | |  \ V /  | | | |
         \__,_| |_| |_|   \_/   |_| |_|

        0.2.0 (f625d0f 2024-04-02T00:16:42.824772000Z)
        https://github.com/foundry-rs/foundry

    Available Accounts
    ==================

    (0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)

    # ...
    Listening on 127.0.0.1:8545
    ```

4.  Make RPC calls against the anvil instance serving at `http://127.0.0.1:8545`

## Background

[Foundry](https://book.getfoundry.sh/reference/anvil/) allows you to start anvil instances with state you read from `json` files.
The idea is to save the state of an anvil instance at a certain point in time, and then load it back up later.

```
$ anvil --state <PATH>
    This is an alias for both --load-state and --dump-state.

    It initializes the chain with the state and block environment stored at the file, if it
    exists, and dumps the chain's state on exit.
```

Source: [Anvil docs](https://book.getfoundry.sh/reference/cli/anvil?highlight=--state#anvil)

We use this feature to pre-configure an anvil instance with core contracts and other state, and then start it up in seconds for testing.
We call this a "devchain". The scripts we use to configure the devchain are here: [`celo-org/celo-monorepo/` > `packages/protocol/migrations_sol`](https://github.com/celo-org/celo-monorepo/tree/master/packages/protocol/migrations_sol)

## Limitations

The anvil instance is not a full Celo node. It is a lightweight, in-memory instance that you can use for testing.

1. It does not sync with the Celo network ❌
1. It does not persist data between sessions ❌
1. It does not support all RPC methods ❌
1. It does not support fee currency transactions (like [CIP64](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md) or [CIP66](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0066.md)) ❌
1. It does not support all Celo pre-compiles ❌

## How we work

We are a GitHub-first team, which means we have a strong preference for communicating via GitHub.
Please use GitHub to:

🐞 [File a bug report](https://github.com/celo-org/celo-monorepo/issues/new/choose)

💬 [Ask a question](https://github.com/celo-org/celo-monorepo/discussions)

✨ [Suggest a feature](https://github.com/celo-org/celo-monorepo/issues/new/choose)

🧑‍💻 [Contribute!](https://github.com/celo-org/celo-monorepo/tree/master/packages/protocol/migrations_sol/CONTRIBUTING.md)

🚔 [Report a security vulnerability](https://github.com/celo-org/celo-monorepo/issues/new/choose)

> [!TIP]
>
> Please avoid messaging us via Slack, Telegram, or email. We are more likely to respond to you on
> GitHub than if you message us anywhere else. We actively monitor GitHub, and will get back to you shortly 🌟
