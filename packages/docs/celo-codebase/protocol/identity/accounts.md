# Key management

There is a pretty funny [tweet](https://twitter.com/LeaKissner/status/1198595109756887040) which goes something like this:

> Crypto is a tool for turning a whole swathe of problems into key management problems. Key management problems are way harder than (virtually all) cryptographers think.

To help with this, we have various mechanisms to reduce the impact of the loss or compromise of keys, mainly through our `Accounts` smart contract. On it, accounts can authorize other keys to perform certain actions on behalf of the account. Keys that need to be accessed frequently (e.g. for signing blocks) are at greater risk of being compromised, and thus have more limited permissions, while keys that need to be accessed infrequently (e.g. for locking Celo Gold) are less onerous to store securely, and thus have more expansive permissions. Below is a summary of the various keys that are used in the Celo network, and a description of their permissions.

| Name of the key        | Purpose                                                                                                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account key            | This is the key with the highest level of permissions, and is thus the most sensitive. It can be used to lock and unlock Celo Gold, and authorize vote, validator, and attestation keys. Note that the account key also has all of the permissions of the other keys. |
| Validator signer key   | This is the key that has permission to register and manage a Validator or Validator Group, and participate in BFT consensus.                                                                                                                                          |
| Vote signer key        | This key can be used to vote in Validator elections and on-chain governance.                                                                                                                                                                                          |
| Attestation signer key | This key is used to sign attestations in Celo's lightweight identity protocol.                                                                                                                                                                                        |

Note that account and signer keys must be unique and may not be reused.

# Key Rotation

Loss of an authorized key no longer has catastrophic implications, as the Account key can just authorize another key in that case. In general, it is good hygene to rotate your keys, just like you should rotate your passwords.

### Key Rotation for Consensus

Key rotation for Consensus is a bit trickier. Let's assume that a validator is currently elected, actively signing consensus messages and wants to rotate their validator signer key. What they should do is the following:

- Bring up a new validator node and create a new validator signer key on it.
- Authorize the new validator signer with the Account key on the `Accounts` smart contract and update the ECDSA and BLS keys as well.
- Your old node will continue to sign consensus messages for the current epoch, but with the starting epoch will find itself no longer authorized.
- Your new node will find itself unauthorized, but will be authorized to sign as the next epoch begins.

# Key Security

It is evident that the Account key is the most sensitive key. As it should be used quite infrequently, it is highly recommended for important Account keys (i.e. Validators or accounts with high balances) to remain as secure as possible. At the minimum, we recommend them to be offline, ideally in cold storage or on a hardware wallet.
