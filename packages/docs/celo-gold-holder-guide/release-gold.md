# ReleaseGold

## Introduction

[`ReleaseGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol) is a smart contract that enables Celo Gold to be released programmatically to a beneficiary over a period of time. In a deployed `ReleaseGold` smart contract, only the Celo Gold balance that has been released according to the release schedule can be withdrawn by the contract’s beneficiary. The unreleased Celo Gold cannot be withdrawn, but can be used for specific functions in Celo’s Proof of Stake protocol, namely voting and validating.

The intent of the `ReleaseGold` contract is to allow beneficiaries to participate in Celo’s Proof of Stake protocol with Celo Gold that has not yet been fully released to them. Beneficiaries are able to lock Celo Gold for voting and validating with the full `ReleaseGold` balance, including both released and unreleased Celo Gold.

Increasing the volume of Celo Gold that can be used in Celo’s Proof of Stake consensus promotes network security and even greater decentralization. See below for details on specific features of the `ReleaseGold` contract, as well as how they are implemented. The [source code](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol) includes documentation, and technical readers are encouraged to find further details there.

### Example

To illustrate with an example, let’s consider a `ReleaseGold` contract deployed with a total balance of 100 Celo Gold. For example purposes, we’ll assume this contract enables both voting and validating.

Let's also assume the beneficiary is an individual who is receiving Celo Gold based on a vesting schedule (or a ‘release schedule’). According to this release schedule, the beneficiary will receive 10% of the total Celo Gold balance each month.

In three months time after deployment, there will be 30 released Celo Gold in the contract, because 10 Celo Gold (10% of 100 Celo Gold) was released each month, for 3 months. Now, the beneficiary can transfer this 30 Celo Gold freely.

The beneficiary does not yet have full rights to the remaining 70 unreleased Celo Gold. However, this 70 Celo Gold while unavailable for withdrawal, can still be used by the beneficiary for voting and validating. This unreleased balance will also continue to release at the rate of 10 Celo Gold per month, until the total balance is empty.

## Addresses Involved

*Beneficiary*

The `beneficiary` address is the recipient of the Celo Gold in the `ReleaseGold` contract. As the Celo Gold is released over time, it is incrementally made withdrawable solely to the beneficiary. The beneficiary is also able to use both unreleased and released Celo Gold to participate in Celo’s Proof of Stake consensus protocol, via locking gold and voting or validating.

*Release Owner*

The `releaseOwner` is the address involved in administering the `ReleaseGold` contract. The release owner may be able to perform actions including [setting the liquidity provision](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol#L268) for the contract, setting the maximum withdrawal amount, or [revoking](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol#L362) the contract, depending on the ReleaseGold configuration.

*Refund Address*

The `refundAddress` is the address where funds that have not been released will be sent if a `ReleaseGold` contract is revoked. Contracts that are not revocable do not have a `refundAddress`.

## Use Cases for `ReleaseGold`

Two anticipated use cases for `ReleaseGold` contracts are for “holders” and “earners”. Note that these are not specified in `ReleaseGold` explicitly, rather they represent sample configurations that the `ReleaseGold` contract supports.

In the “holder” case, a recipient may have purchased or been awarded an amount of Celo Gold, but is subject to a distribution schedule limiting the amount of Celo Gold that can be liquidated at any given time. These recipients may be able to validate and vote with the full `ReleaseGold` balance, and also are not subject to the contract’s revocation by another party (eg. an employer).

In the “earner” case, a grant recipient may have entered a legal contract wherein an exchange of services earns them an amount of Celo Gold over a releasing, or vesting, schedule. These grants are characterized by extra restrictions because the total grant amount is still being *earned*. The `ReleaseGold` balance cannot be used for running a validator, but it can be used to vote for validators and governance proposals on the Celo network. Additionally, these contracts may be revocable and may be subject to the `liquidityProvision` flag, which prevents Celo Gold distribution when markets are incapable of absorbing additional Celo Gold without significant slippage.

## Release Schedule

In `ReleaseGold` smart contracts, a fixed amount of Celo Gold becomes accessible to the `beneficiary` over time.

The following arguments specify a ReleaseGold smart contract schedule:

- `releasePeriod` - the frequency, in seconds, at which Celo Gold is released
    - Some common values: monthly (2628000), every 3 months (7884000)
- `amountReleasedPerPeriod` - the amount of Celo Gold to be released each `releasePeriod`
- `numReleasePeriods` - the number of `releasePeriods` in which Celo Gold will be released
- `releaseCliff` - the time at which the release cliff expires.

The total balance for the ReleaseGold account can be determined by multiplying the `numReleasePeriods` by `amountReleasedPerPeriod`.

Similar to vesting-type schedules with cliffs used for other assets, ReleaseGold allows for a `releaseCliff` (expressed in seconds) before which the released Celo Gold cannot be withdrawn by its beneficiary. A common value for this is `31536000`, which is 1 year.

## Released and Unreleased Celo Gold

In deployed `ReleaseGold` accounts, you can conceptually think of Celo Gold in two states -- released, and unreleased. There are other states including locked, but for the purposes of the contract, these are the two primary states to consider.

Released Celo Gold can be withdrawn to the `beneficiary` where it can be used freely. Unreleased Celo Gold comes with some restrictions. Foremost, it cannot be withdrawn by the beneficiary. If `canVote` and `canValidate` are set to false, the beneficiary cannot vote or validate, respectively.

If the contract permits voting and validating using the unreleased balance, the specific keys to perform these actions must first be authorized. For example, if the `beneficiary` desires to vote using their `ReleaseGold` contract, they must authorize a voting key to vote on the contract’s behalf.

## FAQ

Can I vote for validators, or run a validator using my `ReleaseGold` Celo Gold balance?

- Keep in mind that in a `ReleaseGold` contract, there is both released Celo Gold, and unreleased Celo Gold. You can always vote or validate with the released balance if you are the beneficiary. However, for unreleased Celo Gold, you can only vote or validate if `canVote` or `canValidate` properties are respectively set to true on the contract .

Can the `releaseOwner` access my Celo Gold?

- No, the `releaseOwner` cannot make transactions with the Celo Gold balance in a `ReleaseGold` contract. However, they can perform some administrative functions if the permissions are given at time of deployment. For example, a `releaseOwner` cannot revoke a contract unless the property `revocable` is set to true when the contract is deployed.
- It is highly recommended to review the contract at its deployed address, to learn specific details of a `ReleaseGold` contract.

Can I move the Celo Gold released by the `ReleaseGold` contract to another address?

- Of course! Once Celo Gold is released and the cliff has passed, the beneficiary is free to do what they want with it.

Why do I need to authorize separate keys for voting and validating? Can’t I do it using the private key for my beneficiary address?

- You may use any keys for your voting and validating signers, so long as those keys are not for a registered account or for another signing purpose. This means you *could* use your `beneficiary` address as one of your signing roles, but you would need another account for an additional role.

Can I change the beneficiary?

- Yes, but changing the beneficiary requires signatures from both the `releaseOwner` and the current `beneficiary` of the `ReleaseGold` contract. This is implemented as a two out of two multisig contract.

What if I lose the private key associated with the beneficiary address?

- Unfortunately, if you lose the private key for the beneficiary address, then you won't be able to access your funds. Please be careful in ownership of this key, as it’s loss is irreversible.

What happens if there is a bug in the `ReleaseGold` contract?

- The `ReleaseGold` contract has been reviewed by security firms, and has passed smart contract audits. That said, if any unforeseen bugs are found, it is possible to modify the contract and redeploy it. This process requires a 2/2 multisig agreement from both `releaseOwner` and `beneficiary`.

What is the distribution ratio?

- Some grants are subject to “distribution schedules,” which control the release of funds outside of a traditional vesting schedule for legal reasons. This schedule is controlled by the `distributionRatio` and is adjustable by the `releaseOwner`.
