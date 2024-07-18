# Foundry tests that require an anvil devchain

All tests in this directory are intended to be run against an anvil devchain. To use `forge`
commands in this directory, consume the `[profile.devchain]` defined in
[`foundry.toml`](../../foundry.toml) by
[passing the profile as an environment variable](https://book.getfoundry.sh/config/#configuring-with-foundrytoml),
and use the `--fork-url` flag to point to the anvil devchain.

For example:

1.  Start a local devchain (check latest scripts in [package.json](../../package.json) in
    case this command is out-of-date):

        ```sh
        $ yarn anvil-devchain:start-L1

        Waiting Anvil to launch on 8546...


                                 _   _
                                (_) | |
          __ _   _ __   __   __  _  | |
         / _` | | '_ \  \ \ / / | | | |
        | (_| | | | | |  \ V /  | | | |
         \__,_| |_| |_|   \_/   |_| |_|

        0.2.0 (f625d0f 2024-04-02T00:16:42.824772000Z)
        https://github.com/foundry-rs/foundry

        # ...
        Listening on 127.0.0.1:8546
        ```

1.  Run all tests in this directory against the anvil devchain serving at `$ANVIL_RPC_URL`:

    ```sh
    $ FOUNDRY_PROFILE=devchain forge test -vvv \
    --match-path "test-sol/devchain/e2e/*" \
    --fork-url $ANVIL_RPC_URL
    ```
