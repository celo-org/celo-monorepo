# Celo Monorepo

[![CircleCI](https://circleci.com/gh/celo-org/celo-monorepo/tree/master.svg?style=svg)](https://circleci.com/gh/celo-org/celo-monorepo/tree/master)

**Official repository for core projects comprising the Celo platform**

This repository contains the source code for the Celo core projects including the [smart contracts](https://github.com/celo-org/celo-monorepo/tree/master/packages/protocol), [wallet app](https://github.com/celo-org/celo-monorepo/tree/master/packages/mobile),
and other packages.

The source code for the Celo Blockchain which operates a node on the Celo Network is kept in a separate repo [here](https://github.com/celo-org/celo-blockchain).

### The Celo Stack

Celo is oriented around providing the simplest possible experience for end users, who may have no familiarity with cryptocurrencies, and may be using low cost devices with limited connectivity. To achieve this, the project takes a full-stack approach, where each layer of the stack is designed with the end user in mind whilst considering other stakeholders \(e.g. operators of nodes in the network\) involved in enabling the end user experience.

The Celo stack is structured into the following logical layers:

![](https://storage.googleapis.com/celo-website/docs/full-stack-diagram.jpg)

The Celo Blockchain and Celo Core Contracts together comprise the **Celo Protocol**.

- **Celo Blockchain**: An open cryptographic protocol that allows applications to make transactions with and run smart contracts in a secure and decentralized fashion. The Celo Blockchain has shared ancestry with [Ethereum](https://www.ethereum.org), and maintains full EVM compatibility for smart contracts. However it uses a [Byzantine Fault Tolerant](http://pmg.csail.mit.edu/papers/osdi99.pdf) \(BFT\) consensus mechanism rather than Proof of Work, and has different block format, transaction format, client synchronization protocols, and gas payment and pricing mechanisms. The network’s native asset is Celo Gold, exposed via an ERC-20 interface.
- **Celo Core Contracts**: A set of smart contracts running on the Celo Blockchain that comprise much of the logic of the platform features including ERC-20 stable currencies, identity attestations, Proof of Stake and governance. These smart contracts are upgradeable and managed by the decentralized governance process.

![](https://storage.googleapis.com/celo-website/docs/network.png)
_Topology of a Celo Network_

- **Applications:** Applications for end users built on the Celo platform. The Celo Wallet app, the first of an ecosystem of applications, allows end users to manage accounts and make payments securely and simply by taking advantage of the innovations in the Celo protocol. Applications take the form of external mobile or backend software: they interact with the Celo Blockchain to issue transactions and invoke code that forms the Celo Core Contracts’ API. Third parties can also deploy custom smart contracts that their own applications can invoke, which in turn can leverage Celo Core Contracts. Applications may use centralized cloud services to provide some of their functionality: in the case of the Celo Wallet, push notifications and a transaction activity feed.

## Documentation

See [Developer's Guide](https://docs.celo.org/) for full details about the design of the Celo protocol and other information about running these projects.

## Issues

See the [issue backlog](https://github.com/celo-org/celo-monorepo/issues) for a list of active or proposed tasks. Feel free to create new issues to report bugs and/or request features. Please add labels to your issues, tagging the appropriate package/area.

### 📂 Repo structure
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
- [walletkit](packages/walletkit) - common functions to access smart contracts used by Celo Wallet (deprecated)
- [web](packages/web) - Celo website ([live](https://celo.org/))

Code owners for each package can be found in [.github/CODEOWNERS](.github/CODEOWNERS).

## License & Contributing

All packages are licensed under the terms of the Apache 2.0 License unless otherwise specified in the LICENSE file at package's root.

Improvements and contributions are highly encouraged! See the [contributing guide](https://github.com/celo-org/celo-monorepo/tree/master/.github/CONTRIBUTING.md) for details on how to participate.
