# Class: ReleaseGoldWrapper

Contract for handling an instance of a ReleaseGold contract.

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹ReleaseGold›

  ↳ **ReleaseGoldWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#constructor)

### Properties

* [_relockGold](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#_relockgold)
* [createAccount](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#createaccount)
* [events](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#events)
* [getBeneficiary](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getbeneficiary)
* [getCanValidate](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getcanvalidate)
* [getCanVote](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getcanvote)
* [getCurrentReleasedTotalAmount](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getcurrentreleasedtotalamount)
* [getLiquidityProvisionMet](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getliquidityprovisionmet)
* [getMaxDistribution](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getmaxdistribution)
* [getOwner](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getowner)
* [getRefundAddress](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getrefundaddress)
* [getReleaseOwner](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getreleaseowner)
* [getRemainingLockedBalance](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getremaininglockedbalance)
* [getRemainingTotalBalance](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getremainingtotalbalance)
* [getRemainingUnlockedBalance](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getremainingunlockedbalance)
* [getTotalBalance](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#gettotalbalance)
* [getTotalWithdrawn](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#gettotalwithdrawn)
* [isRevoked](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#isrevoked)
* [lockGold](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#lockgold)
* [setAccount](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setaccount)
* [setAccountDataEncryptionKey](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setaccountdataencryptionkey)
* [setAccountMetadataURL](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setaccountmetadataurl)
* [setAccountName](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setaccountname)
* [setAccountWalletAddress](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setaccountwalletaddress)
* [setBeneficiary](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setbeneficiary)
* [setCanExpire](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setcanexpire)
* [setLiquidityProvision](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setliquidityprovision)
* [setMaxDistribution](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#setmaxdistribution)
* [transfer](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#transfer)
* [unlockGold](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#unlockgold)
* [withdraw](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#withdraw)
* [withdrawLockedGold](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#withdrawlockedgold)

### Accessors

* [address](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#address)

### Methods

* [authorizeAttestationSigner](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#authorizeattestationsigner)
* [authorizeValidatorSigner](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#authorizevalidatorsigner)
* [authorizeValidatorSignerAndBls](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#authorizevalidatorsignerandbls)
* [authorizeVoteSigner](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#authorizevotesigner)
* [getReleaseSchedule](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getreleaseschedule)
* [getReleasedBalanceAtRevoke](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getreleasedbalanceatrevoke)
* [getRevocationInfo](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getrevocationinfo)
* [getRevokeTime](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#getrevoketime)
* [isRevocable](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#isrevocable)
* [refundAndFinalize](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#refundandfinalize)
* [relockGold](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#relockgold)
* [revoke](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#revoke)
* [revokeActive](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#revokeactive)
* [revokePending](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#revokepending)
* [revokeReleasing](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md#revokereleasing)

## Constructors

###  constructor

\+ **new ReleaseGoldWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: ReleaseGold): *[ReleaseGoldWrapper](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | ReleaseGold |

**Returns:** *[ReleaseGoldWrapper](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md)*

## Properties

###  _relockGold

• **_relockGold**: *function* = proxySend(
    this.kit,
    this.contract.methods.relockGold,
    tupleParser(valueToString, valueToString)
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:342](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L342)*

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ (`index`: number, `value`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |
`value` | BigNumber.Value |

___

###  createAccount

• **createAccount**: *function* = proxySend(this.kit, this.contract.methods.createAccount)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:371](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L371)*

Beneficiary creates an account on behalf of the ReleaseGold contract.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getBeneficiary

• **getBeneficiary**: *function* = proxyCall(this.contract.methods.beneficiary)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L87)*

Returns the beneficiary of the ReleaseGold contract

**`returns`** The address of the beneficiary.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

___

###  getCanValidate

• **getCanValidate**: *function* = proxyCall(this.contract.methods.canValidate)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L119)*

Returns true if the contract can validate

**`returns`** If the contract can validate

#### Type declaration:

▸ (): *Promise‹boolean›*

___

###  getCanVote

• **getCanVote**: *function* = proxyCall(this.contract.methods.canVote)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L125)*

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

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:251](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L251)*

Returns the total amount that has already released up to now

**`returns`** The already released gold amount up to the point of call

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getLiquidityProvisionMet

• **getLiquidityProvisionMet**: *function* = proxyCall(
    this.contract.methods.liquidityProvisionMet
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L111)*

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

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L142)*

Returns the maximum amount of gold (regardless of release schedule)
currently allowed for release.

**`returns`** The max amount of gold currently withdrawable.

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getOwner

• **getOwner**: *function* = proxyCall(this.contract.methods.owner)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L105)*

Returns the owner's address of the ReleaseGold contract

**`returns`** The owner's address.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

___

###  getRefundAddress

• **getRefundAddress**: *function* = proxyCall(this.contract.methods.refundAddress)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L99)*

Returns the refund address of the ReleaseGold contract

**`returns`** The refundAddress.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

___

###  getReleaseOwner

• **getReleaseOwner**: *function* = proxyCall(this.contract.methods.releaseOwner)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L93)*

Returns the releaseOwner address of the ReleaseGold contract

**`returns`** The address of the releaseOwner.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

___

###  getRemainingLockedBalance

• **getRemainingLockedBalance**: *function* = proxyCall(
    this.contract.methods.getRemainingLockedBalance,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:241](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L241)*

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

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:221](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L221)*

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

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L231)*

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

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L211)*

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

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L131)*

Returns the total withdrawn amount from the ReleaseGold contract

**`returns`** The total withdrawn amount from the ReleaseGold contract

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  isRevoked

• **isRevoked**: *function* = proxyCall(this.contract.methods.isRevoked)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L187)*

Indicates if the release grant is revoked or not

**`returns`** A boolean indicating revoked releasing (true) or non-revoked(false).

#### Type declaration:

▸ (): *Promise‹boolean›*

___

###  lockGold

• **lockGold**: *function* = proxySend(
    this.kit,
    this.contract.methods.lockGold,
    tupleParser(valueToString)
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:277](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L277)*

Locks gold to be used for voting.

**`param`** The amount of gold to lock

#### Type declaration:

▸ (`value`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  setAccount

• **setAccount**: *function* = proxySend(this.kit, this.contract.methods.setAccount)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:379](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L379)*

Beneficiary creates an account on behalf of the ReleaseGold contract.

**`param`** The name to set

**`param`** The key to set

**`param`** The address to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountDataEncryptionKey

• **setAccountDataEncryptionKey**: *function* = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:403](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L403)*

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountMetadataURL

• **setAccountMetadataURL**: *function* = proxySend(this.kit, this.contract.methods.setAccountMetadataURL)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:391](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L391)*

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountName

• **setAccountName**: *function* = proxySend(this.kit, this.contract.methods.setAccountName)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:385](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L385)*

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountWalletAddress

• **setAccountWalletAddress**: *function* = proxySend(this.kit, this.contract.methods.setAccountWalletAddress)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:397](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L397)*

Sets the wallet address for the account

**`param`** The address to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setBeneficiary

• **setBeneficiary**: *function* = proxySend(this.kit, this.contract.methods.setBeneficiary)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:427](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L427)*

Sets the contract's beneficiary

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setCanExpire

• **setCanExpire**: *function* = proxySend(this.kit, this.contract.methods.setCanExpire)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:417](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L417)*

Sets the contract's `canExpire` field to `_canExpire`

**`param`** If the contract can expire `EXPIRATION_TIME` after the release schedule finishes.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setLiquidityProvision

• **setLiquidityProvision**: *function* = proxySend(this.kit, this.contract.methods.setLiquidityProvision)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:411](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L411)*

Sets the contract's liquidity provision to true

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setMaxDistribution

• **setMaxDistribution**: *function* = proxySend(this.kit, this.contract.methods.setMaxDistribution)

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:422](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L422)*

Sets the contract's max distribution

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transfer

• **transfer**: *function* = proxySend(
    this.kit,
    this.contract.methods.transfer,
    tupleParser(stringIdentity, valueToString)
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:283](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L283)*

#### Type declaration:

▸ (`to`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`to` | [Address](../modules/_contractkit_src_base_.md#address) |
`value` | BigNumber.Value |

___

###  unlockGold

• **unlockGold**: *function* = proxySend(
    this.kit,
    this.contract.methods.unlockGold,
    tupleParser(valueToString)
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:293](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L293)*

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock

#### Type declaration:

▸ (`value`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  withdraw

• **withdraw**: *function* = proxySend(
    this.kit,
    this.contract.methods.withdraw,
    tupleParser(valueToString)
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:362](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L362)*

Transfer released gold from the ReleaseGold instance back to beneficiary.

**`param`** The requested gold amount

#### Type declaration:

▸ (`value`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  withdrawLockedGold

• **withdrawLockedGold**: *function* = proxySend(
    this.kit,
    this.contract.methods.withdrawLockedGold,
    tupleParser(valueToString)
  )

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:352](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L352)*

Withdraw gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**`param`** The index of the pending locked gold withdrawal

#### Type declaration:

▸ (`index`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | BigNumber.Value |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  authorizeAttestationSigner

▸ **authorizeAttestationSigner**(`signer`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:539](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L539)*

Authorizes an address to sign attestation messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the attestation signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSigner

▸ **authorizeValidatorSigner**(`signer`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:456](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L456)*

Authorizes an address to sign validation messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the validator signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**(`signer`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:504](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L504)*

Authorizes an address to sign consensus messages on behalf of the contract's account. Also switch BLS key at the same time.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The contract's account address signed by the signer address. |
`blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
`blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeVoteSigner

▸ **authorizeVoteSigner**(`signer`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:435](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L435)*

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the vote signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  getReleaseSchedule

▸ **getReleaseSchedule**(): *Promise‹ReleaseSchedule›*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L71)*

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** *Promise‹ReleaseSchedule›*

A ReleaseSchedule.

___

###  getReleasedBalanceAtRevoke

▸ **getReleasedBalanceAtRevoke**(): *Promise‹string›*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L202)*

Returns the balance of released gold when the grant was revoked

**Returns:** *Promise‹string›*

The balance at revocation time. 0 can also indicate not revoked.

___

###  getRevocationInfo

▸ **getRevocationInfo**(): *Promise‹RevocationInfo›*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L152)*

Returns the underlying Revocation Info of the ReleaseGold contract

**Returns:** *Promise‹RevocationInfo›*

A RevocationInfo struct.

___

###  getRevokeTime

▸ **getRevokeTime**(): *Promise‹number›*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:193](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L193)*

Returns the time at which the release schedule was revoked

**Returns:** *Promise‹number›*

The timestamp of the release schedule revocation

___

###  isRevocable

▸ **isRevocable**(): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:178](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L178)*

Indicates if the release grant is revocable or not

**Returns:** *Promise‹boolean›*

A boolean indicating revocable releasing (true) or non-revocable(false).

___

###  refundAndFinalize

▸ **refundAndFinalize**(): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:269](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L269)*

Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  relockGold

▸ **relockGold**(`value`: BigNumber.Value): *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:304](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L304)*

Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`value` | BigNumber.Value | The value to relock from the specified pending withdrawal.  |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

___

###  revoke

▸ **revoke**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `group`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber): *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:604](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L604)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`group` | [Address](../modules/_contractkit_src_base_.md#address) |
`value` | BigNumber |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

___

###  revokeActive

▸ **revokeActive**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `group`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:585](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L585)*

Revokes active votes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | The account to revoke from. |
`group` | [Address](../modules/_contractkit_src_base_.md#address) | - |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  revokePending

▸ **revokePending**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `group`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:560](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L560)*

Revokes pending votes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | The account to revoke from. |
`group` | [Address](../modules/_contractkit_src_base_.md#address) | - |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  revokeReleasing

▸ **revokeReleasing**(): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/ReleaseGold.ts:261](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L261)*

Revoke a Release schedule

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject
