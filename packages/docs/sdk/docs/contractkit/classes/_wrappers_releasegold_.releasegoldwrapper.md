[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/ReleaseGold"](../modules/_wrappers_releasegold_.md) › [ReleaseGoldWrapper](_wrappers_releasegold_.releasegoldwrapper.md)

# Class: ReleaseGoldWrapper

Contract for handling an instance of a ReleaseGold contract.

## Hierarchy

  ↳ [BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)‹ReleaseGold›

  ↳ **ReleaseGoldWrapper**

## Index

### Constructors

* [constructor](_wrappers_releasegold_.releasegoldwrapper.md#constructor)

### Properties

* [_relockGold](_wrappers_releasegold_.releasegoldwrapper.md#_relockgold)
* [createAccount](_wrappers_releasegold_.releasegoldwrapper.md#createaccount)
* [eventTypes](_wrappers_releasegold_.releasegoldwrapper.md#eventtypes)
* [events](_wrappers_releasegold_.releasegoldwrapper.md#events)
* [getBeneficiary](_wrappers_releasegold_.releasegoldwrapper.md#getbeneficiary)
* [getCanValidate](_wrappers_releasegold_.releasegoldwrapper.md#getcanvalidate)
* [getCanVote](_wrappers_releasegold_.releasegoldwrapper.md#getcanvote)
* [getCurrentReleasedTotalAmount](_wrappers_releasegold_.releasegoldwrapper.md#getcurrentreleasedtotalamount)
* [getLiquidityProvisionMet](_wrappers_releasegold_.releasegoldwrapper.md#getliquidityprovisionmet)
* [getMaxDistribution](_wrappers_releasegold_.releasegoldwrapper.md#getmaxdistribution)
* [getOwner](_wrappers_releasegold_.releasegoldwrapper.md#getowner)
* [getRefundAddress](_wrappers_releasegold_.releasegoldwrapper.md#getrefundaddress)
* [getReleaseOwner](_wrappers_releasegold_.releasegoldwrapper.md#getreleaseowner)
* [getRemainingLockedBalance](_wrappers_releasegold_.releasegoldwrapper.md#getremaininglockedbalance)
* [getRemainingTotalBalance](_wrappers_releasegold_.releasegoldwrapper.md#getremainingtotalbalance)
* [getRemainingUnlockedBalance](_wrappers_releasegold_.releasegoldwrapper.md#getremainingunlockedbalance)
* [getTotalBalance](_wrappers_releasegold_.releasegoldwrapper.md#gettotalbalance)
* [getTotalWithdrawn](_wrappers_releasegold_.releasegoldwrapper.md#gettotalwithdrawn)
* [isRevoked](_wrappers_releasegold_.releasegoldwrapper.md#isrevoked)
* [lockGold](_wrappers_releasegold_.releasegoldwrapper.md#lockgold)
* [methodIds](_wrappers_releasegold_.releasegoldwrapper.md#methodids)
* [refundAndFinalize](_wrappers_releasegold_.releasegoldwrapper.md#refundandfinalize)
* [revokeBeneficiary](_wrappers_releasegold_.releasegoldwrapper.md#revokebeneficiary)
* [revokeReleasing](_wrappers_releasegold_.releasegoldwrapper.md#revokereleasing)
* [setAccount](_wrappers_releasegold_.releasegoldwrapper.md#setaccount)
* [setAccountDataEncryptionKey](_wrappers_releasegold_.releasegoldwrapper.md#setaccountdataencryptionkey)
* [setAccountMetadataURL](_wrappers_releasegold_.releasegoldwrapper.md#setaccountmetadataurl)
* [setAccountName](_wrappers_releasegold_.releasegoldwrapper.md#setaccountname)
* [setAccountWalletAddress](_wrappers_releasegold_.releasegoldwrapper.md#setaccountwalletaddress)
* [setBeneficiary](_wrappers_releasegold_.releasegoldwrapper.md#setbeneficiary)
* [setCanExpire](_wrappers_releasegold_.releasegoldwrapper.md#setcanexpire)
* [setLiquidityProvision](_wrappers_releasegold_.releasegoldwrapper.md#setliquidityprovision)
* [setMaxDistribution](_wrappers_releasegold_.releasegoldwrapper.md#setmaxdistribution)
* [transfer](_wrappers_releasegold_.releasegoldwrapper.md#transfer)
* [unlockGold](_wrappers_releasegold_.releasegoldwrapper.md#unlockgold)
* [withdraw](_wrappers_releasegold_.releasegoldwrapper.md#withdraw)
* [withdrawLockedGold](_wrappers_releasegold_.releasegoldwrapper.md#withdrawlockedgold)

### Accessors

* [address](_wrappers_releasegold_.releasegoldwrapper.md#address)

### Methods

* [authorizeAttestationSigner](_wrappers_releasegold_.releasegoldwrapper.md#authorizeattestationsigner)
* [authorizeValidatorSigner](_wrappers_releasegold_.releasegoldwrapper.md#authorizevalidatorsigner)
* [authorizeValidatorSignerAndBls](_wrappers_releasegold_.releasegoldwrapper.md#authorizevalidatorsignerandbls)
* [authorizeVoteSigner](_wrappers_releasegold_.releasegoldwrapper.md#authorizevotesigner)
* [getHumanReadableReleaseSchedule](_wrappers_releasegold_.releasegoldwrapper.md#gethumanreadablereleaseschedule)
* [getPastEvents](_wrappers_releasegold_.releasegoldwrapper.md#getpastevents)
* [getReleaseSchedule](_wrappers_releasegold_.releasegoldwrapper.md#getreleaseschedule)
* [getReleasedBalanceAtRevoke](_wrappers_releasegold_.releasegoldwrapper.md#getreleasedbalanceatrevoke)
* [getRevocationInfo](_wrappers_releasegold_.releasegoldwrapper.md#getrevocationinfo)
* [getRevokeTime](_wrappers_releasegold_.releasegoldwrapper.md#getrevoketime)
* [isRevocable](_wrappers_releasegold_.releasegoldwrapper.md#isrevocable)
* [relockGold](_wrappers_releasegold_.releasegoldwrapper.md#relockgold)
* [revoke](_wrappers_releasegold_.releasegoldwrapper.md#revoke)
* [revokeActive](_wrappers_releasegold_.releasegoldwrapper.md#revokeactive)
* [revokeActiveVotes](_wrappers_releasegold_.releasegoldwrapper.md#revokeactivevotes)
* [revokeAllVotesForAllGroups](_wrappers_releasegold_.releasegoldwrapper.md#revokeallvotesforallgroups)
* [revokeAllVotesForGroup](_wrappers_releasegold_.releasegoldwrapper.md#revokeallvotesforgroup)
* [revokePending](_wrappers_releasegold_.releasegoldwrapper.md#revokepending)
* [revokePendingVotes](_wrappers_releasegold_.releasegoldwrapper.md#revokependingvotes)
* [revokeValueFromVotes](_wrappers_releasegold_.releasegoldwrapper.md#revokevaluefromvotes)
* [unlockAllGold](_wrappers_releasegold_.releasegoldwrapper.md#unlockallgold)
* [version](_wrappers_releasegold_.releasegoldwrapper.md#version)

## Constructors

###  constructor

\+ **new ReleaseGoldWrapper**(`connection`: Connection, `contract`: ReleaseGold, `contracts`: ContractWrappersForVotingAndRules): *[ReleaseGoldWrapper](_wrappers_releasegold_.releasegoldwrapper.md)*

*Inherited from [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md).[constructor](_wrappers_validators_.validatorswrapper.md#constructor)*

*Overrides [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | ReleaseGold |
`contracts` | ContractWrappersForVotingAndRules |

**Returns:** *[ReleaseGoldWrapper](_wrappers_releasegold_.releasegoldwrapper.md)*

## Properties

###  _relockGold

• **_relockGold**: *function* = proxySend(
    this.connection,
    this.contract.methods.relockGold,
    tupleParser(valueToString, valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:372](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L372)*

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ (`index`: number, `value`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |
`value` | BigNumber.Value |

___

###  createAccount

• **createAccount**: *function* = proxySend(this.connection, this.contract.methods.createAccount)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:401](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L401)*

Beneficiary creates an account on behalf of the ReleaseGold contract.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *ReleaseGold["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  getBeneficiary

• **getBeneficiary**: *function* = proxyCall(this.contract.methods.beneficiary)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L103)*

Returns the beneficiary of the ReleaseGold contract

**`returns`** The address of the beneficiary.

#### Type declaration:

▸ (): *Promise‹Address›*

___

###  getCanValidate

• **getCanValidate**: *function* = proxyCall(this.contract.methods.canValidate)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L135)*

Returns true if the contract can validate

**`returns`** If the contract can validate

#### Type declaration:

▸ (): *Promise‹boolean›*

___

###  getCanVote

• **getCanVote**: *function* = proxyCall(this.contract.methods.canVote)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:141](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L141)*

Returns true if the contract can vote

**`returns`** If the contract can vote

#### Type declaration:

▸ (): *Promise‹boolean›*

___

###  getCurrentReleasedTotalAmount

• **getCurrentReleasedTotalAmount**: *function* = proxyCall(
    this.contract.methods.getCurrentReleasedTotalAmount,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L267)*

Returns the total amount that has already released up to now

**`returns`** The already released gold amount up to the point of call

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getLiquidityProvisionMet

• **getLiquidityProvisionMet**: *function* = proxyCall(
    this.contract.methods.liquidityProvisionMet
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L127)*

Returns true if the liquidity provision has been met for this contract

**`returns`** If the liquidity provision is met.

#### Type declaration:

▸ (): *Promise‹boolean›*

___

###  getMaxDistribution

• **getMaxDistribution**: *function* = proxyCall(
    this.contract.methods.maxDistribution,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L158)*

Returns the maximum amount of gold (regardless of release schedule)
currently allowed for release.

**`returns`** The max amount of gold currently withdrawable.

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getOwner

• **getOwner**: *function* = proxyCall(this.contract.methods.owner)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L121)*

Returns the owner's address of the ReleaseGold contract

**`returns`** The owner's address.

#### Type declaration:

▸ (): *Promise‹Address›*

___

###  getRefundAddress

• **getRefundAddress**: *function* = proxyCall(this.contract.methods.refundAddress)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L115)*

Returns the refund address of the ReleaseGold contract

**`returns`** The refundAddress.

#### Type declaration:

▸ (): *Promise‹Address›*

___

###  getReleaseOwner

• **getReleaseOwner**: *function* = proxyCall(this.contract.methods.releaseOwner)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L109)*

Returns the releaseOwner address of the ReleaseGold contract

**`returns`** The address of the releaseOwner.

#### Type declaration:

▸ (): *Promise‹Address›*

___

###  getRemainingLockedBalance

• **getRemainingLockedBalance**: *function* = proxyCall(
    this.contract.methods.getRemainingLockedBalance,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:257](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L257)*

Returns the remaining locked gold balance in the ReleaseGold instance

**`returns`** The remaining locked ReleaseGold instance gold balance

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getRemainingTotalBalance

• **getRemainingTotalBalance**: *function* = proxyCall(
    this.contract.methods.getRemainingTotalBalance,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:237](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L237)*

Returns the the sum of locked and unlocked gold in the ReleaseGold instance

**`returns`** The remaining total ReleaseGold instance balance

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getRemainingUnlockedBalance

• **getRemainingUnlockedBalance**: *function* = proxyCall(
    this.contract.methods.getRemainingUnlockedBalance,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L247)*

Returns the remaining unlocked gold balance in the ReleaseGold instance

**`returns`** The available unlocked ReleaseGold instance gold balance

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getTotalBalance

• **getTotalBalance**: *function* = proxyCall(
    this.contract.methods.getTotalBalance,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L227)*

Returns the total balance of the ReleaseGold instance

**`returns`** The total ReleaseGold instance balance

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getTotalWithdrawn

• **getTotalWithdrawn**: *function* = proxyCall(
    this.contract.methods.totalWithdrawn,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L147)*

Returns the total withdrawn amount from the ReleaseGold contract

**`returns`** The total withdrawn amount from the ReleaseGold contract

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  isRevoked

• **isRevoked**: *function* = proxyCall(this.contract.methods.isRevoked)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:203](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L203)*

Indicates if the release grant is revoked or not

**`returns`** A boolean indicating revoked releasing (true) or non-revoked(false).

#### Type declaration:

▸ (): *Promise‹boolean›*

___

###  lockGold

• **lockGold**: *function* = proxySend(
    this.connection,
    this.contract.methods.lockGold,
    tupleParser(valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:301](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L301)*

Locks gold to be used for voting.

**`param`** The amount of gold to lock

#### Type declaration:

▸ (`value`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

___

###  refundAndFinalize

• **refundAndFinalize**: *function* = proxySend(
    this.connection,
    this.contract.methods.refundAndFinalize
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:292](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L292)*

Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.

**`returns`** A CeloTransactionObject

#### Type declaration:

▸ (): *CeloTransactionObject‹void›*

___

###  revokeBeneficiary

• **revokeBeneficiary**: *function* = this.revokeReleasing

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:286](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L286)*

Revoke a vesting CELO schedule from the contract's beneficiary.

**`returns`** A CeloTransactionObject

#### Type declaration:

▸ (): *CeloTransactionObject‹void›*

___

###  revokeReleasing

• **revokeReleasing**: *function* = proxySend(
    this.connection,
    this.contract.methods.revoke
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:277](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L277)*

Revoke a Release schedule

**`returns`** A CeloTransactionObject

#### Type declaration:

▸ (): *CeloTransactionObject‹void›*

___

###  setAccount

• **setAccount**: *function* = proxySend(this.connection, this.contract.methods.setAccount)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:409](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L409)*

Beneficiary creates an account on behalf of the ReleaseGold contract.

**`param`** The name to set

**`param`** The key to set

**`param`** The address to set

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountDataEncryptionKey

• **setAccountDataEncryptionKey**: *function* = proxySend(
    this.connection,
    this.contract.methods.setAccountDataEncryptionKey
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:436](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L436)*

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountMetadataURL

• **setAccountMetadataURL**: *function* = proxySend(this.connection, this.contract.methods.setAccountMetadataURL)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:421](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L421)*

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountName

• **setAccountName**: *function* = proxySend(this.connection, this.contract.methods.setAccountName)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:415](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L415)*

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountWalletAddress

• **setAccountWalletAddress**: *function* = proxySend(
    this.connection,
    this.contract.methods.setAccountWalletAddress
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:427](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L427)*

Sets the wallet address for the account

**`param`** The address to set

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setBeneficiary

• **setBeneficiary**: *function* = proxySend(this.connection, this.contract.methods.setBeneficiary)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:460](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L460)*

Sets the contract's beneficiary

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setCanExpire

• **setCanExpire**: *function* = proxySend(this.connection, this.contract.methods.setCanExpire)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:450](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L450)*

Sets the contract's `canExpire` field to `_canExpire`

**`param`** If the contract can expire `EXPIRATION_TIME` after the release schedule finishes.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setLiquidityProvision

• **setLiquidityProvision**: *function* = proxySend(this.connection, this.contract.methods.setLiquidityProvision)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:444](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L444)*

Sets the contract's liquidity provision to true

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setMaxDistribution

• **setMaxDistribution**: *function* = proxySend(this.connection, this.contract.methods.setMaxDistribution)

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:455](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L455)*

Sets the contract's max distribution

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transfer

• **transfer**: *function* = proxySend(
    this.connection,
    this.contract.methods.transfer,
    tupleParser(stringIdentity, valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:307](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L307)*

#### Type declaration:

▸ (`to`: Address, `value`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`to` | Address |
`value` | BigNumber.Value |

___

###  unlockGold

• **unlockGold**: *function* = proxySend(
    this.connection,
    this.contract.methods.unlockGold,
    tupleParser(valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:317](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L317)*

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock

#### Type declaration:

▸ (`value`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  withdraw

• **withdraw**: *function* = proxySend(
    this.connection,
    this.contract.methods.withdraw,
    tupleParser(valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:392](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L392)*

Transfer released gold from the ReleaseGold instance back to beneficiary.

**`param`** The requested gold amount

#### Type declaration:

▸ (`value`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  withdrawLockedGold

• **withdrawLockedGold**: *function* = proxySend(
    this.connection,
    this.contract.methods.withdrawLockedGold,
    tupleParser(valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:382](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L382)*

Withdraw gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**`param`** The index of the pending locked gold withdrawal

#### Type declaration:

▸ (`index`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | BigNumber.Value |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  authorizeAttestationSigner

▸ **authorizeAttestationSigner**(`signer`: Address, `proofOfSigningKeyPossession`: Signature): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:578](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L578)*

Authorizes an address to sign attestation messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | Address | The address of the attestation signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹CeloTransactionObject‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSigner

▸ **authorizeValidatorSigner**(`signer`: Address, `proofOfSigningKeyPossession`: Signature): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:489](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L489)*

Authorizes an address to sign validation messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | Address | The address of the validator signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹CeloTransactionObject‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**(`signer`: Address, `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:540](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L540)*

Authorizes an address to sign consensus messages on behalf of the contract's account. Also switch BLS key at the same time.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | Address | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The contract's account address signed by the signer address. |
`blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
`blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** *Promise‹CeloTransactionObject‹void››*

A CeloTransactionObject

___

###  authorizeVoteSigner

▸ **authorizeVoteSigner**(`signer`: Address, `proofOfSigningKeyPossession`: Signature): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:468](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L468)*

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | Address | The address of the vote signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹CeloTransactionObject‹void››*

A CeloTransactionObject

___

###  getHumanReadableReleaseSchedule

▸ **getHumanReadableReleaseSchedule**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L88)*

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** *Promise‹object›*

A ReleaseSchedule.

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹ReleaseGold›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹ReleaseGold› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getReleaseSchedule

▸ **getReleaseSchedule**(): *Promise‹ReleaseSchedule›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L72)*

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** *Promise‹ReleaseSchedule›*

A ReleaseSchedule.

___

###  getReleasedBalanceAtRevoke

▸ **getReleasedBalanceAtRevoke**(): *Promise‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L218)*

Returns the balance of released gold when the grant was revoked

**Returns:** *Promise‹string›*

The balance at revocation time. 0 can also indicate not revoked.

___

###  getRevocationInfo

▸ **getRevocationInfo**(): *Promise‹RevocationInfo›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:168](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L168)*

Returns the underlying Revocation Info of the ReleaseGold contract

**Returns:** *Promise‹RevocationInfo›*

A RevocationInfo struct.

___

###  getRevokeTime

▸ **getRevokeTime**(): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:209](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L209)*

Returns the time at which the release schedule was revoked

**Returns:** *Promise‹number›*

The timestamp of the release schedule revocation

___

###  isRevocable

▸ **isRevocable**(): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:194](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L194)*

Indicates if the release grant is revocable or not

**Returns:** *Promise‹boolean›*

A boolean indicating revocable releasing (true) or non-revocable(false).

___

###  relockGold

▸ **relockGold**(`value`: BigNumber.Value): *Promise‹Array‹CeloTransactionObject‹void›››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:334](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L334)*

Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`value` | BigNumber.Value | The value to relock from the specified pending withdrawal.  |

**Returns:** *Promise‹Array‹CeloTransactionObject‹void›››*

___

###  revoke

▸ **revoke**(`account`: Address, `group`: Address, `value`: BigNumber): *Promise‹Array‹CeloTransactionObject‹void›››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:668](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L668)*

Revokes value from pending/active aggregate

**`deprecated`** prefer revokeValueFromVotes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | Address | The account to revoke from. |
`group` | Address | The group to revoke the vote for. |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹Array‹CeloTransactionObject‹void›››*

___

###  revokeActive

▸ **revokeActive**(`account`: Address, `group`: Address, `value`: BigNumber): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:634](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L634)*

Revokes active votes

**`deprecated`** Prefer revokeActiveVotes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | Address | The account to revoke from. |
`group` | Address | The group to revoke the vote for. |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  revokeActiveVotes

▸ **revokeActiveVotes**(`group`: Address, `value`: BigNumber): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:658](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L658)*

Revokes active votes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | Address | The group to revoke the vote for. |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  revokeAllVotesForAllGroups

▸ **revokeAllVotesForAllGroups**(): *Promise‹CeloTransactionObject‹void›[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:716](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L716)*

**Returns:** *Promise‹CeloTransactionObject‹void›[]›*

___

###  revokeAllVotesForGroup

▸ **revokeAllVotesForGroup**(`group`: Address): *Promise‹CeloTransactionObject‹void›[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:698](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L698)*

**Parameters:**

Name | Type |
------ | ------ |
`group` | Address |

**Returns:** *Promise‹CeloTransactionObject‹void›[]›*

___

###  revokePending

▸ **revokePending**(`account`: Address, `group`: Address, `value`: BigNumber): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:600](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L600)*

Revokes pending votes

**`deprecated`** prefer revokePendingVotes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | Address | The account to revoke from. |
`group` | Address | - |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  revokePendingVotes

▸ **revokePendingVotes**(`group`: Address, `value`: BigNumber): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:624](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L624)*

Revokes pending votes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | Address | - |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  revokeValueFromVotes

▸ **revokeValueFromVotes**(`group`: Address, `value`: BigNumber): *Promise‹CeloTransactionObject‹void›[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:695](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L695)*

Revokes value from pending/active aggregate

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | Address | The group to revoke the vote for. |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹CeloTransactionObject‹void›[]›*

___

###  unlockAllGold

▸ **unlockAllGold**(): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/ReleaseGold.ts:323](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L323)*

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
