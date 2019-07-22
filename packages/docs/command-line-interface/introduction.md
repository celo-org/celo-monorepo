---
description: >-
  This Command Line Interface allows users to interact with the Celo Protocol
  smart contracts.
---

# Introduction

## Getting Started

### Docker Image

A docker image that runs the Celo Blockchain client in full sync mode which includes the Celo CLI is available for version pinning.

`$ docker pull us.gcr.io/celo-testnet/celocli:master`

To run this container, use the following command.

`$ docker run --name celo_cli_container -p 8545:8545 us.gcr.io/celo-testnet/celocli:master -v`

Then, in a different tab, an interactive shell where the Celo CLI is available can be obtained.

`$ docker exec -it celo_cli_container /bin/sh`

Make sure to kill the container when you are done.

`$ docker kill celo_cli_container`

### NPM Package

The Celo CLI is also published as a node module on NPM. Assuming you have [npm installed](https://www.npmjs.com/get-npm), you can install the Celo CLI using the following command:

`$ npm install -g @celo/celocli`

{% hint style="info" %}
We are currently deploying the CLI with only Node v10.x LTS support. If you are running a different version of Node, consider using [NVM](https://github.com/nvm-sh/nvm#installation-and-update) to manage your node versions. e.g. with: `nvm install 10 && nvm use 10`
{% endhint %}

### Overview

The tool is broken down into modules and commands with the following pattern:

`celocli <module>:<command> <...args> <...flags?>`

The `celocli` tool assumes that users are running a node which they have access to signing transactions on. The config module is included below for convenience. Use the sidebar to navigate to the other modules.

{% embed url="https://www.npmjs.com/package/@celo/celocli" %}
