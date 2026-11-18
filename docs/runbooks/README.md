# Smart contract incident runbooks

What to do when a Celo smart contract is being exploited, or when a vulnerability is reported that could be exploited before a normal governance proposal can pass.

| Runbook                                                 | Use when the affected contract is                                                                                 |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Core contracts exploit](./core-contracts-exploit.md)   | A Celo core contract on L2 (`packages/protocol`): staking, elections, governance, epoch rewards, fee handling     |
| [OP Stack bridge exploit](./op-stack-bridge-exploit.md) | An L1 bridge or rollup contract on Ethereum: OptimismPortal, bridges, dispute games, or an invalid state proposal |

`./incident-status.sh` prints the current state of every lever both runbooks use (who holds each role, what is paused or frozen, the delay windows). It is read-only. Run it first.

## What does not belong in this repository

This repository is public. Keep the following out of it, including out of issues, pull requests and commit messages:

- Names, phone numbers and on-call rotations of responders and multisig signers.
- Any detail of a vulnerability that is not yet fixed on mainnet, including the fix itself.
- Infrastructure procedures for the sequencer, batcher and proposer.

## Scope: who can act on which contract

Before starting, confirm that Celo Governance or the L1 Safes can actually change the affected contract. `owner()` on the contract (or on its proxy, `_getOwner()`) settles it.

| Contract family                                    | Controlled by                                                   | Runbook                                          |
| -------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Celo core contracts on L2                          | Celo Governance (owner of every core proxy and of the Registry) | [Core contracts](./core-contracts-exploit.md)    |
| OP Stack contracts on Ethereum                     | The L1 Safes (see the bridge runbook)                           | [OP Stack bridge](./op-stack-bridge-exploit.md)  |
| Mento stable assets, reserve, `SortedOracles`      | Mento governance, not Celo Governance                           | Notify Mento. Celo Governance cannot change them |
| Third-party tokens and their fee-currency adapters | The token issuer                                                | Notify the issuer. See "Fee currencies" below    |

**Fee currencies.** If a token that is registered as a fee currency is compromised, Celo Governance cannot fix the token, but it can stop the chain accepting it for gas: `FeeCurrencyDirectory.removeCurrencies(token, index)`, executed as a hotfix (core contracts runbook).

## First 30 minutes

1. **Open a private incident channel and name an incident commander.** One person decides; everyone else reports to them. Start a timestamped log (UTC) of every observation and action.
2. **Confirm it is real.** Find the transactions, the affected contract and whether funds are still moving. Run `./incident-status.sh` and save the output in the log.
3. **Classify.**

   | Severity | Meaning                                                           | Response                                                         |
   | -------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
   | SEV-1    | Funds are being lost now, or can be by anyone who reads the chain | Contain immediately, then fix. Wake signers                      |
   | SEV-2    | Exploitable, but not yet exploited or not publicly known          | Prepare the fix privately. Use the hotfix path, not a public CGP |
   | SEV-3    | Bug with no path to loss of funds or loss of liveness             | Normal release process                                           |

4. **Alert the signers now, before the fix exists.** Collecting signatures is the slowest step of every path in these runbooks. Signers need time to reach their hardware wallets.
5. **Contain, then fix.** Follow the runbook for the affected contract. Rehearse every transaction on a fork before anyone signs it.
6. **Tell dependents privately** if they can reduce losses by acting: exchanges and bridges (halt deposits and withdrawals), Mento, token issuers, validators and RPC providers.

## Rules while the incident is open

- Develop and review the fix in a private repository. A public branch or pull request tells an attacker exactly what to exploit.
- Never share a private key or seed phrase with anyone, including other responders. Signers sign on their own devices.
- Every signer verifies what they sign independently: the hash, the target and the calldata, simulated on a fork. Urgency is what an attacker impersonating a responder will lean on.
- Do not negotiate with an attacker, or send funds anywhere, without the incident commander and legal counsel.
- No public statement until the incident commander approves it. Say what users should do, not how the bug works.

## Public communication

- Announcements go to the Celo Forum [Security Announcements](https://forum.celo.org/c/security-announcements/) category.
- Vulnerability reports from outside arrive as described in the organization security policy (`security.report@clabs.co`). Acknowledge the reporter and keep them informed; they often know the most about the bug.
- First statement, once containment is in place: what is affected, what users should do or avoid, when the next update comes. Leave root cause for the post-mortem.

## Closing the incident

1. Confirm containment and the fix on chain: run `./incident-status.sh`, and for core contracts check the deployed bytecode against the fix branch (`yarn release:verify-deployed:foundry`, see `packages/protocol/RELEASE_PROCESS_FOUNDRY.md`).
2. Undo emergency measures deliberately: unfreeze, unpause, restore any blocker. Each one is its own reviewed transaction.
3. Publish the fix to the public repository only after it is live on mainnet.
4. Publish a post-mortem: timeline, root cause, impact, what was done, what changes. Ratify hotfixes with the community on the forum, since a hotfix bypasses the referendum.
5. Add a regression test, and update these runbooks with whatever was slow, missing or wrong.
