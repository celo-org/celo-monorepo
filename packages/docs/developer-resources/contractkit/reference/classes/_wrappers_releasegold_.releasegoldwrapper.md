# Class: ReleaseGoldWrapper

Contract for handling an instance of a ReleaseGold contract.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹ReleaseGold›

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
* [refundAndFinalize](_wrappers_releasegold_.releasegoldwrapper.md#refundandfinalize)
* [relockGold](_wrappers_releasegold_.releasegoldwrapper.md#relockgold)
* [revoke](_wrappers_releasegold_.releasegoldwrapper.md#revoke)
* [revokeActive](_wrappers_releasegold_.releasegoldwrapper.md#revokeactive)
* [revokePending](_wrappers_releasegold_.releasegoldwrapper.md#revokepending)
* [revokeReleasing](_wrappers_releasegold_.releasegoldwrapper.md#revokereleasing)

## Constructors

###  constructor

\+ **new ReleaseGoldWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: ReleaseGold): *[ReleaseGoldWrapper](_wrappers_releasegold_.releasegoldwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | ReleaseGold |

**Returns:** *[ReleaseGoldWrapper](_wrappers_releasegold_.releasegoldwrapper.md)*

## Properties

###  _relockGold

• **_relockGold**: *function* = proxySend(
    this.kit,
    this.contract.methods.relockGold,
    tupleParser(valueToString, valueToString)
  )

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:357](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L357)*

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ (`index`: number, `value`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |
`value` | BigNumber.Value |

___

###  createAccount

• **createAccount**: *function* = proxySend(this.kit, this.contract.methods.createAccount)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:386](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L386)*

Beneficiary creates an account on behalf of the ReleaseGold contract.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  eventTypes

• **eventTypes**: *object* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)*

#### Type declaration:

___

###  events

• **events**: *ReleaseGold["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

___

###  getBeneficiary

• **getBeneficiary**: *function* = proxyCall(this.contract.methods.beneficiary)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L102)*

Returns the beneficiary of the ReleaseGold contract

**`returns`** The address of the beneficiary.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_base_.md#address)›*

___

###  getCanValidate

• **getCanValidate**: *function* = proxyCall(this.contract.methods.canValidate)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L134)*

Returns true if the contract can validate

**`returns`** If the contract can validate

#### Type declaration:

▸ (): *Promise‹boolean›*

___

###  getCanVote

• **getCanVote**: *function* = proxyCall(this.contract.methods.canVote)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L140)*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:266](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L266)*

Returns the total amount that has already released up to now

**`returns`** The already released gold amount up to the point of call

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getLiquidityProvisionMet

• **getLiquidityProvisionMet**: *function* = proxyCall(
    this.contract.methods.liquidityProvisionMet
  )

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L126)*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L157)*

Returns the maximum amount of gold (regardless of release schedule)
currently allowed for release.

**`returns`** The max amount of gold currently withdrawable.

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  getOwner

• **getOwner**: *function* = proxyCall(this.contract.methods.owner)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L120)*

Returns the owner's address of the ReleaseGold contract

**`returns`** The owner's address.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_base_.md#address)›*

___

###  getRefundAddress

• **getRefundAddress**: *function* = proxyCall(this.contract.methods.refundAddress)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L114)*

Returns the refund address of the ReleaseGold contract

**`returns`** The refundAddress.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_base_.md#address)›*

___

###  getReleaseOwner

• **getReleaseOwner**: *function* = proxyCall(this.contract.methods.releaseOwner)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L108)*

Returns the releaseOwner address of the ReleaseGold contract

**`returns`** The address of the releaseOwner.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_base_.md#address)›*

___

###  getRemainingLockedBalance

• **getRemainingLockedBalance**: *function* = proxyCall(
    this.contract.methods.getRemainingLockedBalance,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:256](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L256)*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:236](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L236)*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:246](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L246)*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L226)*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L146)*

Returns the total withdrawn amount from the ReleaseGold contract

**`returns`** The total withdrawn amount from the ReleaseGold contract

#### Type declaration:

▸ (): *Promise‹BigNumber›*

___

###  isRevoked

• **isRevoked**: *function* = proxyCall(this.contract.methods.isRevoked)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L202)*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:292](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L292)*

Locks gold to be used for voting.

**`param`** The amount of gold to lock

#### Type declaration:

▸ (`value`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  methodIds

• **methodIds**: *object* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)*

#### Type declaration:

___

###  setAccount

• **setAccount**: *function* = proxySend(this.kit, this.contract.methods.setAccount)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:394](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L394)*

Beneficiary creates an account on behalf of the ReleaseGold contract.

**`param`** The name to set

**`param`** The key to set

**`param`** The address to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:418](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L418)*

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountMetadataURL

• **setAccountMetadataURL**: *function* = proxySend(this.kit, this.contract.methods.setAccountMetadataURL)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:406](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L406)*

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountName

• **setAccountName**: *function* = proxySend(this.kit, this.contract.methods.setAccountName)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:400](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L400)*

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setAccountWalletAddress

• **setAccountWalletAddress**: *function* = proxySend(this.kit, this.contract.methods.setAccountWalletAddress)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:412](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L412)*

Sets the wallet address for the account

**`param`** The address to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setBeneficiary

• **setBeneficiary**: *function* = proxySend(this.kit, this.contract.methods.setBeneficiary)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:442](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L442)*

Sets the contract's beneficiary

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setCanExpire

• **setCanExpire**: *function* = proxySend(this.kit, this.contract.methods.setCanExpire)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:432](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L432)*

Sets the contract's `canExpire` field to `_canExpire`

**`param`** If the contract can expire `EXPIRATION_TIME` after the release schedule finishes.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setLiquidityProvision

• **setLiquidityProvision**: *function* = proxySend(this.kit, this.contract.methods.setLiquidityProvision)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:426](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L426)*

Sets the contract's liquidity provision to true

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setMaxDistribution

• **setMaxDistribution**: *function* = proxySend(this.kit, this.contract.methods.setMaxDistribution)

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:437](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L437)*

Sets the contract's max distribution

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:298](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L298)*

#### Type declaration:

▸ (`to`: [Address](../modules/_base_.md#address), `value`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`to` | [Address](../modules/_base_.md#address) |
`value` | BigNumber.Value |

___

###  unlockGold

• **unlockGold**: *function* = proxySend(
    this.kit,
    this.contract.methods.unlockGold,
    tupleParser(valueToString)
  )

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:308](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L308)*

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock

#### Type declaration:

▸ (`value`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:377](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L377)*

Transfer released gold from the ReleaseGold instance back to beneficiary.

**`param`** The requested gold amount

#### Type declaration:

▸ (`value`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:367](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L367)*

Withdraw gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**`param`** The index of the pending locked gold withdrawal

#### Type declaration:

▸ (`index`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | BigNumber.Value |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  authorizeAttestationSigner

▸ **authorizeAttestationSigner**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:554](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L554)*

Authorizes an address to sign attestation messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the attestation signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSigner

▸ **authorizeValidatorSigner**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:471](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L471)*

Authorizes an address to sign validation messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the validator signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:519](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L519)*

Authorizes an address to sign consensus messages on behalf of the contract's account. Also switch BLS key at the same time.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The contract's account address signed by the signer address. |
`blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
`blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeVoteSigner

▸ **authorizeVoteSigner**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:450](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L450)*

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the vote signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  getHumanReadableReleaseSchedule

▸ **getHumanReadableReleaseSchedule**(): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L87)*

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** *Promise‹object›*

A ReleaseSchedule.

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹ReleaseGold›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

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

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L71)*

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** *Promise‹ReleaseSchedule›*

A ReleaseSchedule.

___

###  getReleasedBalanceAtRevoke

▸ **getReleasedBalanceAtRevoke**(): *Promise‹string›*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L217)*

Returns the balance of released gold when the grant was revoked

**Returns:** *Promise‹string›*

The balance at revocation time. 0 can also indicate not revoked.

___

###  getRevocationInfo

▸ **getRevocationInfo**(): *Promise‹RevocationInfo›*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L167)*

Returns the underlying Revocation Info of the ReleaseGold contract

**Returns:** *Promise‹RevocationInfo›*

A RevocationInfo struct.

___

###  getRevokeTime

▸ **getRevokeTime**(): *Promise‹number›*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:208](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L208)*

Returns the time at which the release schedule was revoked

**Returns:** *Promise‹number›*

The timestamp of the release schedule revocation

___

###  isRevocable

▸ **isRevocable**(): *Promise‹boolean›*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:193](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L193)*

Indicates if the release grant is revocable or not

**Returns:** *Promise‹boolean›*

A boolean indicating revocable releasing (true) or non-revocable(false).

___

###  refundAndFinalize

▸ **refundAndFinalize**(): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:284](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L284)*

Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  relockGold

▸ **relockGold**(`value`: BigNumber.Value): *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:319](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L319)*

Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`value` | BigNumber.Value | The value to relock from the specified pending withdrawal.  |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

___

###  revoke

▸ **revoke**(`account`: [Address](../modules/_base_.md#address), `group`: [Address](../modules/_base_.md#address), `value`: BigNumber): *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:619](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L619)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`group` | [Address](../modules/_base_.md#address) |
`value` | BigNumber |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

___

###  revokeActive

▸ **revokeActive**(`account`: [Address](../modules/_base_.md#address), `group`: [Address](../modules/_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:600](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L600)*

Revokes active votes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_base_.md#address) | The account to revoke from. |
`group` | [Address](../modules/_base_.md#address) | - |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  revokePending

▸ **revokePending**(`account`: [Address](../modules/_base_.md#address), `group`: [Address](../modules/_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:575](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L575)*

Revokes pending votes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_base_.md#address) | The account to revoke from. |
`group` | [Address](../modules/_base_.md#address) | - |
`value` | BigNumber | The amount of gold to revoke.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  revokeReleasing

▸ **revokeReleasing**(): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/ReleaseGold.ts:276](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L276)*

Revoke a Release schedule

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject
