# Celotool

A useful tool for various scripts that we as an engineering team might run.
There are two versions, one in python and one in typescript.
The TS version is being more actively developed at this time.

# CelotoolJs (Typescript)

## Setup

```
# Install packages
yarn
```

If you want to use this tool from anywhere, add an alias to your ~/.bash_profile.

`alias celotooljs="<YOUR_PATH_TO_MONOREPO>/packages/celotool/bin/celotooljs.sh"`

## Usage

Running `celotooljs` should give you the output like the following that let's you know what you can do:

    celotooljs <command>

    Commands:
    celotooljs account <accountCommand>     commands for inviting, fauceting,
                                            looking up accounts and users
    celotooljs backup                       command for backing up a miner's
                                            persistent volume (PVC)
    celotooljs copy-contract-artifacts      command for copying contract
                                            artifacts in a format to be easily
                                            consumed by other (typescript)
                                            packages. It will use the ABI of a
                                            particular contract and swap the
                                            address for the address of the
                                            Proxy.
    celotooljs copy-policies                command for copying stackdriver
                                            alerting policies from one
                                            environment to another
    celotooljs deploy <deployMethod>        commands for deployment of various
    <deployPackage>                         packages in the monorepo
    celotooljs geth <command>               commands for geth
    celotooljs links <resource>             commands for various useful links
    celotooljs port-forward                 command for port-forwarding to a
                                            specific network
    celotooljs restore                      command for restoring a miner's
                                            persistent volume (PVC) from
                                            snapshot
    celotooljs switch                       command for switching to a
                                            particular environment
    celotooljs transactions <command>       commands for reading transaction
                                            data

    Options:
    --version     Show version number                                  [boolean]
    --verbose     Whether to show a bunch of debugging output like stdout and
                  stderr of shell commands            [boolean] [default: false]
    --yesreally   Reply "yes" to prompts about changing staging/production
                  (be careful!)                       [boolean] [default: false]
    --help        Show help                                            [boolean]

### How to Invite Yourself

Run this command:
`celotooljs account invite --celo-env integration --phone +<YOUR_E164_PHONE_NUMBER>`

### How to Faucet an Account

Run this command:
`celotooljs account faucet --celo-env <integration-or-your-testnet> --account <account-address>`

### How to Setup a Local Celo Blockchain Node

You might need to setup a local node for some reasons, therefore `celotooljs` provides you with
a few useful commands to make running a node really easy.

- Clone [Celo Blockchain repo](https://github.com/celo-org/celo-blockchain)
- Build `celotooljs geth build --geth-dir <directory-where-you-cloned-geth-repo> -c`
- Init `celotooljs geth init --geth-dir <directory-where-you-cloned-geth-repo> --data-dir <geth-data-dir> -e <env-name>`
- Run `celotooljs geth run --geth-dir <directory-where-you-cloned-geth-repo> --data-dir <geth-data-dir> --sync-mode <full | fast | light | celolatest>`
