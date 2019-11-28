---
description: >-
  This Command Line Interface allows users to interact with the Celo Protocol
  smart contracts.
---

# Introduction

## Getting Started

You can install the Celo CLI as a NPM Package or if you don't have NPM or are having trouble installing the Celo CLI with your version of node, you can use a docker image that runs the Celo Blockchain client in full sync mode which includes the Celo CLI.

### NPM Package

#### Installation
The Celo CLI is published as a node module on NPM. Prerequisites for the installation:
- Node v10.x LTS
- Python 2.7
- node-gyp

##### Node v10.x LTS
If you are running a different version of Node, consider using [NVM](https://github.com/nvm-sh/nvm#installation-and-update) (Linux, Mac OSX) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage your node versions.

`nvm install 10 && nvm use 10` to install and use the recommended environment.

##### Python 2.7
Consider using [Miniconda](https://docs.conda.io/en/latest/miniconda.html) as a Python environment manager.
`conda create --name py2 python=2.7`
`conda activate py2` to install and use the recommended environment.

##### node-gyp
node-gyp is Node.js native addon build tool. The installation procedure can be found [here](https://github.com/nodejs/node-gyp).

{% hint style="info" %}
Note about the node-gyp installation on Windows. Should you opt for the Visual Studio Build Tools. The optional "Windows 10 SDK (10.X)" during the Visual Studio Build Tools installer is required for node-gyp to work.
{% endhint %}

You can now install the Celo CLI using the following command:

```bash
npm install -g @celo/celocli
```
Check if the celocli is installed by requesting its version:
```bash
# celocli -v
@celo/celocli/0.0.X ... node-v10.17.0
```

More info about the NPM celocli package:
{% embed url="https://www.npmjs.com/package/@celo/celocli" %}

#### Upgrades

Check all the pre-requisites under installation before using the following command:

```bash
npm update -g @celo/celocli
```

#### Uninstall

##### celocli
```bash
npm uninstall celocli
```
##### node-gyp
Follow the uninstall procedure [here](https://github.com/nodejs/node-gyp).

##### Python 2.7
`conda deactivate <YOUR PYTHON2 ENV_NAME>`

`conda env remove -name <YOUR PYTHON2 ENV_NAME>` removes the Python 2 environment.

##### Node v10.x LTS
`nvm uninstall 10` removes the Node 10 environment.

### Docker Image

```bash
docker pull us.gcr.io/celo-testnet/celocli:master
```

For more details on configuring this container, see the [Running a Full Node](../getting-started/running-a-full-node.md) section. You can run the container with the following command.

```bash
docker run --name celo_cli_container -it -p 8545:8545 us.gcr.io/celo-testnet/celocli:master -v
```

With additional arguments to the image, it can also be run in ultralight sync mode.

```bash
docker run --name celo_cli_container -p 8545:8545 --entrypoint=/celo/start_geth.sh us.gcr.io/celo-testnet/celocli:master "/usr/local/bin/geth" "alfajores" "ultralight"
```

An interactive shell where the Celo CLI is available can be obtained via the following command. All of the subsequent documentation should be appropriate from this shell.

```bash
docker exec -it celo_cli_container /bin/sh
```

Make sure to kill the container when you are done.

```bash
docker kill celo_cli_container
```

### **Prerequisites for using the Celo CLI**

- **You have a full node running.** See the [Running a Full Node](running-a-full-node.md) instructions for more details on running a full node.

### Overview

The tool is broken down into modules and commands with the following pattern:

```bash
celocli <module>:<command> <...args> <...flags?>
```

The `celocli` tool assumes that users are running a node which they have access to signing transactions on. The config module is included below for convenience. Use the sidebar to navigate to the other modules.

**All balances of Celo Gold or Celo Dollars returned from the CeloCLI are expressed in units of 10<sup>-18</sup>**
