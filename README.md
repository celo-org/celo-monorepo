# Celo Monorepo

[![CircleCI](https://circleci.com/gh/celo-org/celo-monorepo/tree/master.svg?style=svg)](https://circleci.com/gh/celo-org/celo-monorepo/tree/master)

**Official repository for core projects comprising the Celo platform**

This repository contains the source code for the Celo core projects including the [smart contracts](https://github.com/celo-org/celo-monorepo/tree/master/packages/protocol), [wallet app](https://github.com/celo-org/celo-monorepo/tree/master/packages/mobile),
and other packages.

The source code for the Celo Blockchain which operates a node on the Celo Network is kept in a separate repo [here](https://github.com/celo-org/celo-blockchain).

### Celo's Mission - Prosperity for All

Celo, pronounced /ˈtselo/, means ‘purpose’ in Esperanto. In a similar spirit, we are aiming to create a new platform to connect people globally and bring financial stability to those who need it most. We believe blockchain technology is one of the most exciting innovations in recent history and as a community we look to push the boundaries of what is possible with it today. More importantly, we are driven by purpose -- to solve real-world problems such as lack of access to sound currency, or friction for cash-transfer programs aimed to alleviate poverty. Our mission is to build a monetary system that creates the conditions for prosperity for all.

<!-- image with YouTube link -->
<p align="center">
  <a href="http://www.youtube.com/watch?v=kKggE5OvyhE">
    <img src="https://i.imgur.com/GHF5U9B.jpg" alt="Play on Youtube - What if money were beautiful" title="Play on Youtube - What if money were beautiful" width="800" style="border:none;"/>
  </a>
  <br />
  <i>What if money were beautiful?</i>
</p>

### The Celo Stack

Celo is oriented around providing the simplest possible experience for end users, who may have no familiarity with cryptocurrencies, and may be using low cost devices with limited connectivity. To achieve this, the project takes a full-stack approach, where each layer of the stack is designed with the end user in mind whilst considering other stakeholders \(e.g. operators of nodes in the network\) involved in enabling the end user experience.

The Celo stack is structured into the following logical layers:

<!-- image -->
<p align="center">
  <img src="https://storage.googleapis.com/celo-website/docs/full-stack-diagram.jpg" alt="Celo protocol" width="900" style="border:none;"/>
  <br />
  <i>The Celo Blockchain and Celo Core Contracts together comprise the <b>Celo Protocol</b> </i>
</p>

- **Celo Blockchain**: An open cryptographic protocol that allows applications to make transactions with and run smart contracts in a secure and decentralized fashion. The Celo Blockchain has shared ancestry with [Ethereum](https://www.ethereum.org), and maintains full EVM compatibility for smart contracts. However it uses a [Byzantine Fault Tolerant](http://pmg.csail.mit.edu/papers/osdi99.pdf) \(BFT\) consensus mechanism rather than Proof of Work, and has different block format, transaction format, client synchronization protocols, and gas payment and pricing mechanisms. The network’s native asset is Celo Gold, exposed via an ERC-20 interface.

- **Celo Core Contracts**: A set of smart contracts running on the Celo Blockchain that comprise much of the logic of the platform features including ERC-20 stable currencies, identity attestations, Proof of Stake and governance. These smart contracts are upgradeable and managed by the decentralized governance process.

<!-- image -->
<p align="center">
  <img src="https://storage.googleapis.com/celo-website/docs/network.png" alt="Celo network" width="900" style="border:none;"/>
  <br />
  <i>Topology of a Celo Network</i>
</p>

- **Applications:** Applications for end users built on the Celo platform. The Celo Wallet app, the first of an ecosystem of applications, allows end users to manage accounts and make payments securely and simply by taking advantage of the innovations in the Celo protocol. Applications take the form of external mobile or backend software: they interact with the Celo Blockchain to issue transactions and invoke code that forms the Celo Core Contracts’ API. Third parties can also deploy custom smart contracts that their own applications can invoke, which in turn can leverage Celo Core Contracts. Applications may use centralized cloud services to provide some of their functionality: in the case of the Celo Wallet, push notifications and a transaction activity feed.

### 📚 Documentation

See [Developer's Guide](https://docs.celo.org/) for full details about the design of the Celo protocol and other information about running these projects.

### 🙋 Issues

See the [issue backlog](https://github.com/celo-org/celo-monorepo/issues) for a list of active or proposed tasks. Feel free to create new issues to report bugs and/or request features. Please add labels to your issues, tagging the appropriate package/area.

### ✍️ Contributing

Feel free to jump on the Celo 🚂🚋🚋🚋. Improvements and contributions are highly encouraged! 🙏👊

See the [contributing guide](CONTRIBUTING.md) for details on how to participate.
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/1%20hour%20tasks)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3A%221+hour+tasks%22)

Not yet ready to contribute but do like the project? Support Celo with a ⭐ or share the love in a [![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fcelo.org%2F)](https://twitter.com/intent/tweet?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DkKggE5OvyhE&via=celohq&text=Checkout%20celo%21%20Love%20what%20they%20are%20building.&hashtags=celo)

<!--
Twitter
twitter intent generator - http://tech.cymi.org/tweet-intents
-->

### 💬 Ask questions, find answers, and get in touch:

- [Website](https://celo.org/)
- [Docs](https://docs.celo.org/)
- [Blog](https://medium.com/celohq) 📖
- [YouTube](https://www.youtube.com/channel/UCCZgos_YAJSXm5QX5D5Wkcw/videos?view=0&sort=p&flow=grid) 🎬
- [Forum](https://forum.celo.org)
- [Discord](https://discord.gg/JvJ66Wc) 🎙
- [Twitter](https://twitter.com/celohq)
- [Reddit](https://www.reddit.com/r/CeloHQ/)
- [Community Events](https://celo.org/community) 🎉

### 📜 License

All packages are licensed under the terms of the Apache 2.0 License unless otherwise specified in the LICENSE file at package's root.
