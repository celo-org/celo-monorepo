# ReleaseGoldWrapper

Contract for handling an instance of a ReleaseGold contract.

## Hierarchy

* [BaseWrapper]()‹ReleaseGold›

  ↳ **ReleaseGoldWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [\_relockGold]()
* [createAccount]()
* [eventTypes]()
* [events]()
* [getBeneficiary]()
* [getCanValidate]()
* [getCanVote]()
* [getCurrentReleasedTotalAmount]()
* [getLiquidityProvisionMet]()
* [getMaxDistribution]()
* [getOwner]()
* [getRefundAddress]()
* [getReleaseOwner]()
* [getRemainingLockedBalance]()
* [getRemainingTotalBalance]()
* [getRemainingUnlockedBalance]()
* [getTotalBalance]()
* [getTotalWithdrawn]()
* [isRevoked]()
* [lockGold]()
* [methodIds]()
* [setAccount]()
* [setAccountDataEncryptionKey]()
* [setAccountMetadataURL]()
* [setAccountName]()
* [setAccountWalletAddress]()
* [setBeneficiary]()
* [setCanExpire]()
* [setLiquidityProvision]()
* [setMaxDistribution]()
* [transfer]()
* [unlockGold]()
* [withdraw]()
* [withdrawLockedGold]()

### Accessors

* [address]()

### Methods

* [authorizeAttestationSigner]()
* [authorizeValidatorSigner]()
* [authorizeValidatorSignerAndBls]()
* [authorizeVoteSigner]()
* [getHumanReadableReleaseSchedule]()
* [getPastEvents]()
* [getReleaseSchedule]()
* [getReleasedBalanceAtRevoke]()
* [getRevocationInfo]()
* [getRevokeTime]()
* [isRevocable]()
* [refundAndFinalize]()
* [relockGold]()
* [revoke]()
* [revokeActive]()
* [revokePending]()
* [revokeReleasing]()

## Constructors

### constructor

+ **new ReleaseGoldWrapper**\(`kit`: [ContractKit](), `contract`: ReleaseGold\): [_ReleaseGoldWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | ReleaseGold |

**Returns:** [_ReleaseGoldWrapper_]()

## Properties

### \_relockGold

• **\_relockGold**: _function_ = proxySend\( this.kit, this.contract.methods.relockGold, tupleParser\(valueToString, valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:357_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L357)

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ \(`index`: number, `value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `index` | number |
| `value` | BigNumber.Value |

### createAccount

• **createAccount**: _function_ = proxySend\(this.kit, this.contract.methods.createAccount\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:386_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L386)

Beneficiary creates an account on behalf of the ReleaseGold contract.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _ReleaseGold\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### getBeneficiary

• **getBeneficiary**: _function_ = proxyCall\(this.contract.methods.beneficiary\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L102)

Returns the beneficiary of the ReleaseGold contract

**`returns`** The address of the beneficiary.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_›_

### getCanValidate

• **getCanValidate**: _function_ = proxyCall\(this.contract.methods.canValidate\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L134)

Returns true if the contract can validate

**`returns`** If the contract can validate

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getCanVote

• **getCanVote**: _function_ = proxyCall\(this.contract.methods.canVote\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:140_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L140)

Returns true if the contract can vote

**`returns`** If the contract can vote

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getCurrentReleasedTotalAmount

• **getCurrentReleasedTotalAmount**: _function_ = proxyCall\( this.contract.methods.getCurrentReleasedTotalAmount, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:266_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L266)

Returns the total amount that has already released up to now

**`returns`** The already released gold amount up to the point of call

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getLiquidityProvisionMet

• **getLiquidityProvisionMet**: _function_ = proxyCall\( this.contract.methods.liquidityProvisionMet \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:126_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L126)

Returns true if the liquidity provision has been met for this contract

**`returns`** If the liquidity provision is met.

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getMaxDistribution

• **getMaxDistribution**: _function_ = proxyCall\( this.contract.methods.maxDistribution, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L157)

Returns the maximum amount of gold \(regardless of release schedule\) currently allowed for release.

**`returns`** The max amount of gold currently withdrawable.

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getOwner

• **getOwner**: _function_ = proxyCall\(this.contract.methods.owner\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L120)

Returns the owner's address of the ReleaseGold contract

**`returns`** The owner's address.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_›_

### getRefundAddress

• **getRefundAddress**: _function_ = proxyCall\(this.contract.methods.refundAddress\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:114_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L114)

Returns the refund address of the ReleaseGold contract

**`returns`** The refundAddress.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_›_

### getReleaseOwner

• **getReleaseOwner**: _function_ = proxyCall\(this.contract.methods.releaseOwner\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:108_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L108)

Returns the releaseOwner address of the ReleaseGold contract

**`returns`** The address of the releaseOwner.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_›_

### getRemainingLockedBalance

• **getRemainingLockedBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingLockedBalance, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:256_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L256)

Returns the remaining locked gold balance in the ReleaseGold instance

**`returns`** The remaining locked ReleaseGold instance gold balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getRemainingTotalBalance

• **getRemainingTotalBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingTotalBalance, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:236_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L236)

Returns the the sum of locked and unlocked gold in the ReleaseGold instance

**`returns`** The remaining total ReleaseGold instance balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getRemainingUnlockedBalance

• **getRemainingUnlockedBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingUnlockedBalance, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:246_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L246)

Returns the remaining unlocked gold balance in the ReleaseGold instance

**`returns`** The available unlocked ReleaseGold instance gold balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getTotalBalance

• **getTotalBalance**: _function_ = proxyCall\( this.contract.methods.getTotalBalance, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:226_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L226)

Returns the total balance of the ReleaseGold instance

**`returns`** The total ReleaseGold instance balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getTotalWithdrawn

• **getTotalWithdrawn**: _function_ = proxyCall\( this.contract.methods.totalWithdrawn, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:146_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L146)

Returns the total withdrawn amount from the ReleaseGold contract

**`returns`** The total withdrawn amount from the ReleaseGold contract

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### isRevoked

• **isRevoked**: _function_ = proxyCall\(this.contract.methods.isRevoked\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:202_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L202)

Indicates if the release grant is revoked or not

**`returns`** A boolean indicating revoked releasing \(true\) or non-revoked\(false\).

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### lockGold

• **lockGold**: _function_ = proxySend\( this.kit, this.contract.methods.lockGold, tupleParser\(valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:292_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L292)

Locks gold to be used for voting.

**`param`** The amount of gold to lock

#### Type declaration:

▸ \(`value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### setAccount

• **setAccount**: _function_ = proxySend\(this.kit, this.contract.methods.setAccount\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:394_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L394)

Beneficiary creates an account on behalf of the ReleaseGold contract.

**`param`** The name to set

**`param`** The key to set

**`param`** The address to set

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setAccountDataEncryptionKey

• **setAccountDataEncryptionKey**: _function_ = proxySend\( this.kit, this.contract.methods.setAccountDataEncryptionKey \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:418_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L418)

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setAccountMetadataURL

• **setAccountMetadataURL**: _function_ = proxySend\(this.kit, this.contract.methods.setAccountMetadataURL\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:406_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L406)

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setAccountName

• **setAccountName**: _function_ = proxySend\(this.kit, this.contract.methods.setAccountName\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:400_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L400)

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setAccountWalletAddress

• **setAccountWalletAddress**: _function_ = proxySend\(this.kit, this.contract.methods.setAccountWalletAddress\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:412_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L412)

Sets the wallet address for the account

**`param`** The address to set

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setBeneficiary

• **setBeneficiary**: _function_ = proxySend\(this.kit, this.contract.methods.setBeneficiary\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:442_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L442)

Sets the contract's beneficiary

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setCanExpire

• **setCanExpire**: _function_ = proxySend\(this.kit, this.contract.methods.setCanExpire\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:432_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L432)

Sets the contract's `canExpire` field to `_canExpire`

**`param`** If the contract can expire `EXPIRATION_TIME` after the release schedule finishes.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setLiquidityProvision

• **setLiquidityProvision**: _function_ = proxySend\(this.kit, this.contract.methods.setLiquidityProvision\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:426_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L426)

Sets the contract's liquidity provision to true

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setMaxDistribution

• **setMaxDistribution**: _function_ = proxySend\(this.kit, this.contract.methods.setMaxDistribution\)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:437_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L437)

Sets the contract's max distribution

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transfer

• **transfer**: _function_ = proxySend\( this.kit, this.contract.methods.transfer, tupleParser\(stringIdentity, valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:298_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L298)

#### Type declaration:

▸ \(`to`: [Address](_base_.md#address), `value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `to` | [Address](_base_.md#address) |
| `value` | BigNumber.Value |

### unlockGold

• **unlockGold**: _function_ = proxySend\( this.kit, this.contract.methods.unlockGold, tupleParser\(valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:308_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L308)

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock

#### Type declaration:

▸ \(`value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

### withdraw

• **withdraw**: _function_ = proxySend\( this.kit, this.contract.methods.withdraw, tupleParser\(valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:377_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L377)

Transfer released gold from the ReleaseGold instance back to beneficiary.

**`param`** The requested gold amount

#### Type declaration:

▸ \(`value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

### withdrawLockedGold

• **withdrawLockedGold**: _function_ = proxySend\( this.kit, this.contract.methods.withdrawLockedGold, tupleParser\(valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:367_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L367)

Withdraw gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**`param`** The index of the pending locked gold withdrawal

#### Type declaration:

▸ \(`index`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `index` | BigNumber.Value |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### authorizeAttestationSigner

▸ **authorizeAttestationSigner**\(`signer`: [Address](_base_.md#address), `proofOfSigningKeyPossession`: Signature\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:554_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L554)

Authorizes an address to sign attestation messages on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the attestation signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### authorizeValidatorSigner

▸ **authorizeValidatorSigner**\(`signer`: [Address](_base_.md#address), `proofOfSigningKeyPossession`: Signature\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:471_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L471)

Authorizes an address to sign validation messages on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the validator signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**\(`signer`: [Address](_base_.md#address), `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:519_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L519)

Authorizes an address to sign consensus messages on behalf of the contract's account. Also switch BLS key at the same time.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The contract's account address signed by the signer address. |
| `blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
| `blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### authorizeVoteSigner

▸ **authorizeVoteSigner**\(`signer`: [Address](_base_.md#address), `proofOfSigningKeyPossession`: Signature\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:450_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L450)

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the vote signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### getHumanReadableReleaseSchedule

▸ **getHumanReadableReleaseSchedule**\(\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L87)

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** _Promise‹object›_

A ReleaseSchedule.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹ReleaseGold›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹ReleaseGold› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getReleaseSchedule

▸ **getReleaseSchedule**\(\): _Promise‹ReleaseSchedule›_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L71)

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** _Promise‹ReleaseSchedule›_

A ReleaseSchedule.

### getReleasedBalanceAtRevoke

▸ **getReleasedBalanceAtRevoke**\(\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:217_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L217)

Returns the balance of released gold when the grant was revoked

**Returns:** _Promise‹string›_

The balance at revocation time. 0 can also indicate not revoked.

### getRevocationInfo

▸ **getRevocationInfo**\(\): _Promise‹RevocationInfo›_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:167_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L167)

Returns the underlying Revocation Info of the ReleaseGold contract

**Returns:** _Promise‹RevocationInfo›_

A RevocationInfo struct.

### getRevokeTime

▸ **getRevokeTime**\(\): _Promise‹number›_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:208_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L208)

Returns the time at which the release schedule was revoked

**Returns:** _Promise‹number›_

The timestamp of the release schedule revocation

### isRevocable

▸ **isRevocable**\(\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:193_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L193)

Indicates if the release grant is revocable or not

**Returns:** _Promise‹boolean›_

A boolean indicating revocable releasing \(true\) or non-revocable\(false\).

### refundAndFinalize

▸ **refundAndFinalize**\(\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:284_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L284)

Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### relockGold

▸ **relockGold**\(`value`: BigNumber.Value\): _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:319_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L319)

Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `value` | BigNumber.Value | The value to relock from the specified pending withdrawal. |

**Returns:** _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

### revoke

▸ **revoke**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:619_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L619)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `group` | [Address](_base_.md#address) |
| `value` | BigNumber |

**Returns:** _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

### revokeActive

▸ **revokeActive**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:600_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L600)

Revokes active votes

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | [Address](_base_.md#address) | The account to revoke from. |
| `group` | [Address](_base_.md#address) | - |
| `value` | BigNumber | The amount of gold to revoke. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### revokePending

▸ **revokePending**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:575_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L575)

Revokes pending votes

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | [Address](_base_.md#address) | The account to revoke from. |
| `group` | [Address](_base_.md#address) | - |
| `value` | BigNumber | The amount of gold to revoke. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### revokeReleasing

▸ **revokeReleasing**\(\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/ReleaseGold.ts:276_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L276)

Revoke a Release schedule

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

