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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | ReleaseGold |

**Returns:** [_ReleaseGoldWrapper_]()

## Properties

### \_relockGold

• **\_relockGold**: _function_ = proxySend\( this.kit, this.contract.methods.relockGold, tupleParser\(valueToString, valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:343_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L343)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:372_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L372)

Beneficiary creates an account on behalf of the ReleaseGold contract.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### getBeneficiary

• **getBeneficiary**: _function_ = proxyCall\(this.contract.methods.beneficiary\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L88)

Returns the beneficiary of the ReleaseGold contract

**`returns`** The address of the beneficiary.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_›_

### getCanValidate

• **getCanValidate**: _function_ = proxyCall\(this.contract.methods.canValidate\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L120)

Returns true if the contract can validate

**`returns`** If the contract can validate

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getCanVote

• **getCanVote**: _function_ = proxyCall\(this.contract.methods.canVote\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:126_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L126)

Returns true if the contract can vote

**`returns`** If the contract can vote

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getCurrentReleasedTotalAmount

• **getCurrentReleasedTotalAmount**: _function_ = proxyCall\( this.contract.methods.getCurrentReleasedTotalAmount, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:252_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L252)

Returns the total amount that has already released up to now

**`returns`** The already released gold amount up to the point of call

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getLiquidityProvisionMet

• **getLiquidityProvisionMet**: _function_ = proxyCall\( this.contract.methods.liquidityProvisionMet \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L112)

Returns true if the liquidity provision has been met for this contract

**`returns`** If the liquidity provision is met.

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getMaxDistribution

• **getMaxDistribution**: _function_ = proxyCall\( this.contract.methods.maxDistribution, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:143_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L143)

Returns the maximum amount of gold \(regardless of release schedule\) currently allowed for release.

**`returns`** The max amount of gold currently withdrawable.

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getOwner

• **getOwner**: _function_ = proxyCall\(this.contract.methods.owner\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L106)

Returns the owner's address of the ReleaseGold contract

**`returns`** The owner's address.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_›_

### getRefundAddress

• **getRefundAddress**: _function_ = proxyCall\(this.contract.methods.refundAddress\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L100)

Returns the refund address of the ReleaseGold contract

**`returns`** The refundAddress.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_›_

### getReleaseOwner

• **getReleaseOwner**: _function_ = proxyCall\(this.contract.methods.releaseOwner\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L94)

Returns the releaseOwner address of the ReleaseGold contract

**`returns`** The address of the releaseOwner.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_›_

### getRemainingLockedBalance

• **getRemainingLockedBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingLockedBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:242_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L242)

Returns the remaining locked gold balance in the ReleaseGold instance

**`returns`** The remaining locked ReleaseGold instance gold balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getRemainingTotalBalance

• **getRemainingTotalBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingTotalBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:222_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L222)

Returns the the sum of locked and unlocked gold in the ReleaseGold instance

**`returns`** The remaining total ReleaseGold instance balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getRemainingUnlockedBalance

• **getRemainingUnlockedBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingUnlockedBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:232_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L232)

Returns the remaining unlocked gold balance in the ReleaseGold instance

**`returns`** The available unlocked ReleaseGold instance gold balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getTotalBalance

• **getTotalBalance**: _function_ = proxyCall\( this.contract.methods.getTotalBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:212_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L212)

Returns the total balance of the ReleaseGold instance

**`returns`** The total ReleaseGold instance balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getTotalWithdrawn

• **getTotalWithdrawn**: _function_ = proxyCall\( this.contract.methods.totalWithdrawn, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L132)

Returns the total withdrawn amount from the ReleaseGold contract

**`returns`** The total withdrawn amount from the ReleaseGold contract

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### isRevoked

• **isRevoked**: _function_ = proxyCall\(this.contract.methods.isRevoked\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:188_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L188)

Indicates if the release grant is revoked or not

**`returns`** A boolean indicating revoked releasing \(true\) or non-revoked\(false\).

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### lockGold

• **lockGold**: _function_ = proxySend\( this.kit, this.contract.methods.lockGold, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:278_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L278)

Locks gold to be used for voting.

**`param`** The amount of gold to lock

#### Type declaration:

▸ \(`value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

### setAccount

• **setAccount**: _function_ = proxySend\(this.kit, this.contract.methods.setAccount\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:380_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L380)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:404_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L404)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:392_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L392)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:386_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L386)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:398_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L398)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:428_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L428)

Sets the contract's beneficiary

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setCanExpire

• **setCanExpire**: _function_ = proxySend\(this.kit, this.contract.methods.setCanExpire\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:418_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L418)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:412_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L412)

Sets the contract's liquidity provision to true

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setMaxDistribution

• **setMaxDistribution**: _function_ = proxySend\(this.kit, this.contract.methods.setMaxDistribution\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:423_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L423)

Sets the contract's max distribution

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transfer

• **transfer**: _function_ = proxySend\( this.kit, this.contract.methods.transfer, tupleParser\(stringIdentity, valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:284_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L284)

#### Type declaration:

▸ \(`to`: [Address](_base_.md#address), `value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `to` | [Address](_base_.md#address) |
| `value` | BigNumber.Value |

### unlockGold

• **unlockGold**: _function_ = proxySend\( this.kit, this.contract.methods.unlockGold, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:294_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L294)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:363_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L363)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:353_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L353)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### authorizeAttestationSigner

▸ **authorizeAttestationSigner**\(`signer`: [Address](_base_.md#address), `proofOfSigningKeyPossession`: Signature\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:540_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L540)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:457_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L457)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:505_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L505)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:436_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L436)

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the vote signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### getReleaseSchedule

▸ **getReleaseSchedule**\(\): _Promise‹ReleaseSchedule›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L72)

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** _Promise‹ReleaseSchedule›_

A ReleaseSchedule.

### getReleasedBalanceAtRevoke

▸ **getReleasedBalanceAtRevoke**\(\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:203_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L203)

Returns the balance of released gold when the grant was revoked

**Returns:** _Promise‹string›_

The balance at revocation time. 0 can also indicate not revoked.

### getRevocationInfo

▸ **getRevocationInfo**\(\): _Promise‹RevocationInfo›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:153_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L153)

Returns the underlying Revocation Info of the ReleaseGold contract

**Returns:** _Promise‹RevocationInfo›_

A RevocationInfo struct.

### getRevokeTime

▸ **getRevokeTime**\(\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:194_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L194)

Returns the time at which the release schedule was revoked

**Returns:** _Promise‹number›_

The timestamp of the release schedule revocation

### isRevocable

▸ **isRevocable**\(\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L179)

Indicates if the release grant is revocable or not

**Returns:** _Promise‹boolean›_

A boolean indicating revocable releasing \(true\) or non-revocable\(false\).

### refundAndFinalize

▸ **refundAndFinalize**\(\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:270_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L270)

Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### relockGold

▸ **relockGold**\(`value`: BigNumber.Value\): _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:305_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L305)

Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `value` | BigNumber.Value | The value to relock from the specified pending withdrawal. |

**Returns:** _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

### revoke

▸ **revoke**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:605_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L605)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `group` | [Address](_base_.md#address) |
| `value` | BigNumber |

**Returns:** _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

### revokeActive

▸ **revokeActive**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:586_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L586)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:561_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L561)

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

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:262_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/ReleaseGold.ts#L262)

Revoke a Release schedule

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

