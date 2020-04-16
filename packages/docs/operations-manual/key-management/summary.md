# Key management

> Crypto is a tool for turning a whole swathe of problems into key management problems. Key management problems are way harder than (virtually all) cryptographers think.
>
> [@LeaKissner on Twitter](https://twitter.com/LeaKissner/status/1198595109756887040)


## Philosophy

The Celo protocol was designed with the understanding that there is often an inherent tradeoff between the convenience of accessessing a private key and the security with which that private key can be custodied. As such, the protocol allows users to authorize private keys with specific, limited privileges. This allows users to custody each private key according to its sensitivity (i.e. what is the impact of this key being lost or stolen?) and usage patterns (i.e. how often and under which circumstances will this key need to be accessed).


## Summary

The table below outlines a summary of the various key prototypes in the Celo protocol. Note that these key types are often  *mutually exclusive*. A key that has been designated as one key type can often not be used for a different purpose. Also note that under the hood, all of these keys (other than the BLS signer) are secp256k1 ECDSA keys, and thus can be used to send most non-proof-of-stake related transactions, just as an "undesignated" key can. Different key types are simply a concept encoded into the Celo proof-of-stake smart contracts, specifically [Accounts.sol](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol).

For more details on a specific key type, please see the more detailed sections below.


| Type                                | Description                                                                                      | Ledger compatible |
| ----------------------------------- |--------------------------------------------------------------------------------------------------|-----|
| Undesignated                        | Default key type, cannot participate in proof-of-stake                                           | Yes |
| Locked Gold Account                 | Used to lock and unlock cGLD and authorize other keys                                            | Yes |
| Authorized vote signer              | Can vote on behalf of a Locked Gold Account                                                      | Yes |
| Authorized validator (group) signer | Can register and manage a validator group on behalf of a Locked Gold Account                     | Yes |
| Authorized validator signer         | Can register, manage a validator, and sign consensus messages on behalf of a Locked Gold Account | No  |
| Authorized validator BLS signer     | Used to sign blocks as a validator                                                               | No  |
| Authorized attestations signer      | Can sign attestations messages on behalf of a Locked Gold account                                | No  |


{% hint style="warning" %}
A Locked Gold Account may have at most one authorized signer key of each type at any time. Once a signer key is authorized, the only way to deauthorize that key is to authorize a new key that has never previously been used as an authorized signer key for any Locked Gold Account. It follows then that a newly deauthorized key cannot be reauthorized for any account.
{% endhint %}
