---
description: >-
  This Command Line Interface allows users to interact with the Celo Protocol
  smart contracts.
---

# Introduction

## Getting Started

### NPM Package

The Celo CLI is published as a node module on NPM. Assuming you have [npm installed](https://www.npmjs.com/get-npm), you can install the Celo CLI using the following command:

```bash
npm install -g @celo/celocli
```

{% hint style="info" %}
We are currently deploying the CLI with only Node v10.x LTS support. If you are running a different version of Node, consider using [NVM](https://github.com/nvm-sh/nvm#installation-and-update) to manage your node versions. e.g. with: `nvm install 10 && nvm use 10`
{% endhint %}

### **Prerequisites**

- **You have a full node running.** See the [Running a Full Node](running-a-full-node.md) instructions for more details on running a full node.

### Overview

The tool is broken down into modules and commands with the following pattern:

```bash
celocli <module>:<command> <...args> <...flags?>
```

The `celocli` tool assumes that users are running a node which they have access to signing transactions on. The config module is included below for convenience. Use the sidebar to navigate to the other modules.

**All balances of Celo Gold or Celo Dollars returned from the CeloCLI are expressed in units of 10<sup>-18</sup>**

{% embed url="https://www.npmjs.com/package/@celo/celocli" %}
