# Future Privacy Research

Celo is committed to meet the privacy needs of its users. This section describes future plans for delivering on this commitment, while also sharing the current limitations of the Celo networks.

### Privacy mode

One downside to this identity protocol is that knowledge of a phone number can let anyone quickly determine the balance of the associated wallet, which of course may be unacceptable for many use cases. For these circumstances, the contract allows users to use the `Attestations` contract in privacy mode. In this mode, the user does not map their phone number to their wallet address, but to an account that is not meant to be the recipient of transfers. Through a registered encryption key on the user’s account on the contract, schemes can be derived to allow users to selectively reveal their true wallet addresses to authorized participants.

### Transaction and Balance Privacy

As with most public blockchains \(e.g. Bitcoin, Ethereum\), transactions and smart contracts calls on Celo are public for everyone to see. This means that if a user wants to map the hash of their phone number to their wallet address, people with knowledge of that user's phone number will be able to see their transactions and balances.

To address this issue, the cLabs team, [Matterlabs](https://matterlabs.dev) and other esteemed zk-SNARK cryptographers and Celo community members are working to create a framework that makes it easy to create gas-efficient tokens that offer Zcash-like privacy, using a shared anonymity pool. Such an implementation could allow wallets to use the default identity mode easily without the risk that someone with your phone number could see your balance and transaction history.

