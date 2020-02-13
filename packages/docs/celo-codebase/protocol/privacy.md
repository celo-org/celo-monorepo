# Privacy

At Celo, we are committed to meet the privacy needs of our users at the time of mainnet launch. This section describes our future plans for delivering on this commitment, while also sharing the current limitations of the Alfajores Testnet.

### Transaction and Balance Privacy

As with most public blockchains \(e.g. Bitcoin, Ethereum\), transactions and smart contracts calls on Celo are public for everyone to see. This means that if a user wants to map the hash of their phone number to their wallet address, people with knowledge of that user's phone number will be able to see their transactions and balances.

To address this issue, the cLabs team is working with [Matterlabs](https://matterlabs.dev) and other esteemed zk-SNARK cryptographers to create a framework that makes it easy to create gas-efficient tokens that offer Zcash-like privacy, using a shared anonymity pool. Such an implementation would allow wallets to use the [default identity mode](identity/) easily without the risk that someone with your phone number could see your balance and transaction history.

Prior to this, we recommend wallet providers to use the [privacy identity mode](identity/#privacy-mode) so that only users that you have explicitly approved can map your phone number to your wallet address and see your balances/transactions.

### Keeping your Phone Number Private

In the Alfajores Testnet, to make it easy for your friends and contacts to look up either your communication key, or your wallet address, by your phone number, Celo keeps a mapping of a hash of your phone number to these keys on-chain. Unfortunately, phone numbers have limited entropy, and so it is difficult, but not impossible, for someone with a lot of resources to obtain the phone numbers of users of the network \(using a brute force attack\). For this reason, we recommend that you do not verify your phone number on the Alfajores Testnet if you do not want your phone number associated with the Testnet.

Ahead of mainnet, we are exploring solutions to this problem by encrypting the hashes using trusted execution environments and by introducing rate limiting through cryptographic means such as timebox puzzles, remote hashing, or through leaking shares of your private key.
