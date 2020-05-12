---
description: >-
  This Command Line Interface allows users to interact with the Celo Protocol
  smart contracts.
---

# Introduction

## Getting Started

### **Prerequisites**

- **You have a Celo node running.** Commands will connect to a Celo node to execute most functionality. See the [Running a Full Node](../getting-started/running-a-full-node-in-rc1.md) instructions for more details on running a full node.

### NPM Package

The Celo CLI is published as a node module on NPM. Assuming you have [npm installed](https://www.npmjs.com/get-npm), you can install the Celo CLI using the following command:

```bash
npm install -g @celo/celocli
```

{% hint style="info" %}
We are currently deploying the CLI with only Node v10.x LTS support. If you are running a different version of Node, consider using [NVM](https://github.com/nvm-sh/nvm#installation-and-update) to manage your node versions. e.g. with: `nvm install 10 && nvm use 10`
{% endhint %}

{% hint style="info" %}
If you have trouble installing globally (i.e. with the `-g` flag), try installing to a local directory instead with `npm install @celo/celocli` and run with `npx celocli`.
{% endhint %}

### Overview

The tool is broken down into modules and commands with the following pattern:

```text
celocli <module>:<command> <...args> <...flags?>
```

The `celocli` tool assumes that users are running a node which they have access to signing transactions on.
See documentation on the [config](./config.md) module for information about how set which node commands are sent to.

{% hint style="info" %}
**All balances of Celo Gold or Celo Dollars are expressed in units of 10<sup>-18</sup>**
{% endhint %}

{% embed url="https://www.npmjs.com/package/@celo/celocli" %}

### Using a Ledger Wallet

The Celo CLI supports using a [Ledger hardware wallet](../celo-gold-holder-guide/ledger.md) to sign transactions.

### Plugins

Additional plugins can be installed which make the CLI experience smoother.

The autocomplete plugin adds an interactive autocomplete for `bash` and `zsh` shells. To enable the autocomplete plugin, follow the instructions provided at:

```text
celocli autocomplete
```

The update warning plugin notifies the user if they are using an oudated version of the CLI. This plugin is enabled by default.
