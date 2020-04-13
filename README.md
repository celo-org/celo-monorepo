<p align="center">
  <a href="https://celo.org/">
    <img src="https://i.imgur.com/fyrJi0R.png" alt="celo logo" title="Go to celo.org" width="600" style="border:none;"/>
  </a>
</p>

**Celo Monorepo - Official repository for core projects comprising the Celo platform**

This repository contains the source code for the Celo core projects including the [smart contracts](https://github.com/celo-org/celo-monorepo/tree/master/packages/protocol), [wallet app](https://github.com/celo-org/celo-monorepo/tree/master/packages/mobile),
and other packages. The source code for the Celo Blockchain which operates a node on the Celo Network is kept in a separate repo [here](https://github.com/celo-org/celo-blockchain).

<!-- row 1 - status -->

[![CircleCI](https://img.shields.io/circleci/build/github/celo-org/celo-monorepo/master)](https://circleci.com/gh/celo-org/celo-monorepo/tree/master)
[![Codecov](https://img.shields.io/codecov/c/github/celo-org/celo-monorepo)](https://codecov.io/gh/celo-org/celo-monorepo)
[![GitHub contributors](https://img.shields.io/github/contributors/celo-org/celo-monorepo)](https://github.com/celo-org/celo-monorepo/graphs/contributors)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/w/celo-org/celo-monorepo)](https://github.com/celo-org/celo-monorepo/graphs/contributors)
[![GitHub Stars](https://img.shields.io/github/stars/celo-org/celo-monorepo.svg)](https://github.com/celo-org/celo-monorepo/stargazers)
![GitHub repo size](https://img.shields.io/github/repo-size/celo-org/celo-monorepo)
[![GitHub](https://img.shields.io/github/license/celo-org/celo-monorepo?color=blue)](https://github.com/celo-org/celo-monorepo/blob/master/LICENSE)

<!-- row 2 - links & profiles -->

[![Website celo.org](https://img.shields.io/website-up-down-green-red/https/celo.org.svg)](https://celo.org)
[![Blog](https://img.shields.io/badge/blog-up-green)](https://medium.com/celoorg)
[![docs](https://img.shields.io/badge/docs-up-green)](https://docs.celo.org/)
[![Youtube](https://img.shields.io/badge/YouTube%20channel-up-green)](https://www.youtube.com/channel/UCCZgos_YAJSXm5QX5D5Wkcw/videos?view=0&sort=p&flow=grid)
[![forum](https://img.shields.io/badge/forum-up-green)](https://forum.celo.org)
[![Discord](https://img.shields.io/discord/600834479145353243.svg)](https://discord.gg/RfHQKtY)
[![Twitter CeloDevs](https://img.shields.io/twitter/follow/celodevs?style=social)](https://twitter.com/celodevs)
[![Twitter CeloOrg](https://img.shields.io/twitter/follow/celoorg?style=social)](https://twitter.com/CeloOrg)
[![Subreddit subscribers](https://img.shields.io/reddit/subreddit-subscribers/CeloHQ?style=social)](https://www.reddit.com/r/CeloHQ/)

<!-- row 3 - detailed status -->

[![GitHub pull requests by-label](https://img.shields.io/github/issues-pr-raw/celo-org/celo-monorepo)](https://github.com/celo-org/celo-monorepo/pulls)
[![GitHub Issues](https://img.shields.io/github/issues-raw/celo-org/celo-monorepo.svg)](https://github.com/celo-org/celo-monorepo/issues)
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/1%20hour%20tasks)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3A%221+hour+tasks%22)
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/betanet-phase-2)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3Abetanet-phase-2)
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/betanet-phase-3)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3Abetanet-phase-3)

Contents:

<!-- TOC -->

- [Celo's Mission - Prosperity for All](#mission)
- [The Celo Stack](#stack)
- [Documentation](#docs)
- [Issues](#issues)
- [Repo Structure](#repo)
- [Contributing](#contributing)
- [Ask Questions, Find Answers, Get in Touch](#ask)
- [License](#license)
  <!-- /TOC -->

## 🥅 <a id="mission"></a>Celo's Mission - Prosperity for All

Celo, pronounced /ˈtselo/, means ‘purpose’ in Esperanto. In a similar spirit, we are aiming to create a new platform to connect people globally and bring financial stability to those who need it most. We believe blockchain technology is one of the most exciting innovations in recent history and as a community we look to push the boundaries of what is possible with it today. More importantly, we are driven by purpose -- to solve real-world problems such as lack of access to sound currency, or friction for cash-transfer programs aimed to alleviate poverty. Our mission is to build a monetary system that creates the conditions for prosperity for all.

<!-- image with YouTube link -->
<p align="center">
  <a href="http://www.youtube.com/watch?v=kKggE5OvyhE">
    <img src="https://i.imgur.com/GHF5U9B.jpg" alt="Play on Youtube - What if money were beautiful" title="Play on Youtube - What if money were beautiful" width="600" style="border:none;"/>
  </a>
  <br />
  <i>What if money were beautiful?</i>
</p>

## 🧱 <a id="stack"></a>The Celo Stack

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

## 📚 <a id="docs"></a>Documentation

Follow the instructions in [SETUP.md](SETUP.md) to get a development environment set up.

See [Developer's Guide](https://docs.celo.org/) for full details about the design of the Celo protocol and other information about running these projects.

## 🙋 <a id="issues"></a>Issues

See the [issue backlog](https://github.com/celo-org/celo-monorepo/issues) for a list of active or proposed tasks. Feel free to create new issues to report bugs and/or request features.

## 📂 <a id="repo"></a>Repo Structure

The repository has the following packages (sub projects):

- [analytics](packages/analytics) - Cloud Dataflow/Apache Beam jobs for processing Celo Wallet logs and telemetry
- [attestation-service](packages/attestation-service) - service run by validators on the Celo network to send SMS messages, enabling attestations of user phone numbers and their accounts on the Celo network
- [blockchain-api](packages/analytics) - service that uses Blockscout to present view of transactions by account for Celo Wallet activity feed
- [celotool](packages/celotool) - scripts for deploying and managing testnets
- [cli](packages/cli) - tool that uses ContractKit to interact with the Celo protocol ([docs](https://docs.celo.org/getting-started/using-the-cli))
- [contractkit](packages/contractkit) - library to help developers and validators interact with the protocol and it's smart contracts ([docs](https://docs.celo.org/celo-sdk/contractkit))
- [dappkit](packages/dappkit) - set of functions for mobile DApps to work with the wallet app (ex. sign transactions and access the user's account) ([docs](https://docs.celo.org/celo-sdk/dappkit))
- [dev-utils](packages/dev-utils) - a utils package for use as a dev dependency
- [docs](packages/docs) - technical documentation for the Celo project ([live](https://docs.celo.org/))
- [faucet](packages/faucet) - faucet deployment configuration ([live](https://celo.org/build/faucet))
- [helm-charts](packages/helm-charts) - templatized deployments of entire environments to Kubernetes clusters
- [mobile](packages/mobile) - Android wallet app for the Celo platform ([docs](https://docs.celo.org/getting-started/using-the-mobile-wallet), [live](https://play.google.com/store/apps/details?id=org.celo.mobile.alfajores))
- [notification-service](packages/notification-service) - service for managing push notifications for Celo Wallet
- [protocol](packages/protocol) - identity, stability and other smart contracts for the Celo protocol ([docs](https://docs.celo.org/celo-codebase/protocol))
- [react-components](packages/react-components) - no README available (improve?)
- [terraform-modules](packages/terraform-modules) - templatized deployments of entire VM-based testnets for Google Cloud Platform
- [transaction-metrics-exporter](packages/transaction-metrics-exporter) - monitoring tool that executes transactions on the network and exports testnet-level prometheus metrics
- [typescript](packages/typescript) - no README available (improve?)
- [utils](packages/utils) - no README available (improve?)
- [verification-pool-api](packages/verification-pool-api) - service that handles a pool of Verifier App instances and requests them to direct SMS for attestation purposes (deprecated)
- [verifier](packages/verifier) - Android verifier app to send SMS messages, enabling attestations of user phone numbers and their accounts on the Celo network
- [web](packages/web) - Celo website ([live](https://celo.org/))

Code owners for each package can be found in [.github/CODEOWNERS](.github/CODEOWNERS).

## ✍️ <a id="contributing"></a>Contributing

Feel free to jump on the Celo 🚂🚋🚋🚋. Improvements and contributions are highly encouraged! 🙏👊

See the [contributing guide](https://docs.celo.org/community/contributing) for details on how to participate.
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/1%20hour%20tasks)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3A%221+hour+tasks%22)

Not yet ready to contribute but do like the project? Support Celo with a ⭐ or share the love in a [![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fcelo.org%2F)](https://twitter.com/intent/tweet?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DkKggE5OvyhE&via=celohq&text=Checkout%20celo%21%20Love%20what%20they%20are%20building.&hashtags=celo)

<!--
Twitter
twitter intent generator - http://tech.cymi.org/tweet-intents
-->

## 💬 <a id="ask"></a>Ask Questions, Find Answers, Get in Touch

- [Website](https://celo.org/)
- [Docs](https://docs.celo.org/)
- [Blog](https://medium.com/celohq)
- [YouTube](https://www.youtube.com/channel/UCCZgos_YAJSXm5QX5D5Wkcw/videos?view=0&sort=p&flow=grid)
- [Forum](https://forum.celo.org)
- [Discord](https://discord.gg/vRbExjv)
- [Twitter](https://twitter.com/CeloDevs)
- [Reddit](https://www.reddit.com/r/CeloHQ/)
- [Community Events](https://celo.org/community)

## 📜 <a id="license"></a>License

All packages are licensed under the terms of the [Apache 2.0 License](LICENSE) unless otherwise specified in the LICENSE file at package's root.
