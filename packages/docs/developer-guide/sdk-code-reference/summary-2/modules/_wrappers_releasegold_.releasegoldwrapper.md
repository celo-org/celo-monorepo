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
* [refundAndFinalize]()
* [revokeReleasing]()
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
* [relockGold]()
* [revoke]()
* [revokeActive]()
* [revokePending]()

## Constructors

### constructor

+ **new ReleaseGoldWrapper**\(`kit`: [ContractKit](), `contract`: ReleaseGold\): [_ReleaseGoldWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | ReleaseGold |

**Returns:** [_ReleaseGoldWrapper_]()

## Properties

### \_relockGold

• **\_relockGold**: _function_ = proxySend\( this.kit, this.contract.methods.relockGold, tupleParser\(valueToString, valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:358_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L358)

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ \(`index`: number, `value`: BigNumber.Value\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `index` | number |
| `value` | BigNumber.Value |

### createAccount

• **createAccount**: _function_ = proxySend\(this.kit, this.contract.methods.createAccount\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:387_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L387)

Beneficiary creates an account on behalf of the ReleaseGold contract.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _ReleaseGold\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getBeneficiary

• **getBeneficiary**: _function_ = proxyCall\(this.contract.methods.beneficiary\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:101_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L101)

Returns the beneficiary of the ReleaseGold contract

**`returns`** The address of the beneficiary.

#### Type declaration:

▸ \(\): _Promise‹Address›_

### getCanValidate

• **getCanValidate**: _function_ = proxyCall\(this.contract.methods.canValidate\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L133)

Returns true if the contract can validate

**`returns`** If the contract can validate

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getCanVote

• **getCanVote**: _function_ = proxyCall\(this.contract.methods.canVote\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:139_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L139)

Returns true if the contract can vote

**`returns`** If the contract can vote

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getCurrentReleasedTotalAmount

• **getCurrentReleasedTotalAmount**: _function_ = proxyCall\( this.contract.methods.getCurrentReleasedTotalAmount, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:265_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L265)

Returns the total amount that has already released up to now

**`returns`** The already released gold amount up to the point of call

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getLiquidityProvisionMet

• **getLiquidityProvisionMet**: _function_ = proxyCall\( this.contract.methods.liquidityProvisionMet \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L125)

Returns true if the liquidity provision has been met for this contract

**`returns`** If the liquidity provision is met.

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### getMaxDistribution

• **getMaxDistribution**: _function_ = proxyCall\( this.contract.methods.maxDistribution, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:156_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L156)

Returns the maximum amount of gold \(regardless of release schedule\) currently allowed for release.

**`returns`** The max amount of gold currently withdrawable.

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getOwner

• **getOwner**: _function_ = proxyCall\(this.contract.methods.owner\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:119_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L119)

Returns the owner's address of the ReleaseGold contract

**`returns`** The owner's address.

#### Type declaration:

▸ \(\): _Promise‹Address›_

### getRefundAddress

• **getRefundAddress**: _function_ = proxyCall\(this.contract.methods.refundAddress\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:113_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L113)

Returns the refund address of the ReleaseGold contract

**`returns`** The refundAddress.

#### Type declaration:

▸ \(\): _Promise‹Address›_

### getReleaseOwner

• **getReleaseOwner**: _function_ = proxyCall\(this.contract.methods.releaseOwner\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:107_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L107)

Returns the releaseOwner address of the ReleaseGold contract

**`returns`** The address of the releaseOwner.

#### Type declaration:

▸ \(\): _Promise‹Address›_

### getRemainingLockedBalance

• **getRemainingLockedBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingLockedBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:255_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L255)

Returns the remaining locked gold balance in the ReleaseGold instance

**`returns`** The remaining locked ReleaseGold instance gold balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getRemainingTotalBalance

• **getRemainingTotalBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingTotalBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:235_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L235)

Returns the the sum of locked and unlocked gold in the ReleaseGold instance

**`returns`** The remaining total ReleaseGold instance balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getRemainingUnlockedBalance

• **getRemainingUnlockedBalance**: _function_ = proxyCall\( this.contract.methods.getRemainingUnlockedBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:245_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L245)

Returns the remaining unlocked gold balance in the ReleaseGold instance

**`returns`** The available unlocked ReleaseGold instance gold balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getTotalBalance

• **getTotalBalance**: _function_ = proxyCall\( this.contract.methods.getTotalBalance, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:225_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L225)

Returns the total balance of the ReleaseGold instance

**`returns`** The total ReleaseGold instance balance

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### getTotalWithdrawn

• **getTotalWithdrawn**: _function_ = proxyCall\( this.contract.methods.totalWithdrawn, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:145_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L145)

Returns the total withdrawn amount from the ReleaseGold contract

**`returns`** The total withdrawn amount from the ReleaseGold contract

#### Type declaration:

▸ \(\): _Promise‹BigNumber›_

### isRevoked

• **isRevoked**: _function_ = proxyCall\(this.contract.methods.isRevoked\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:201_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L201)

Indicates if the release grant is revoked or not

**`returns`** A boolean indicating revoked releasing \(true\) or non-revoked\(false\).

#### Type declaration:

▸ \(\): _Promise‹boolean›_

### lockGold

• **lockGold**: _function_ = proxySend\( this.kit, this.contract.methods.lockGold, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:293_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L293)

Locks gold to be used for voting.

**`param`** The amount of gold to lock

#### Type declaration:

▸ \(`value`: BigNumber.Value\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined
      ? '0x'
      : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### refundAndFinalize

• **refundAndFinalize**: _function_ = proxySend\( this.kit, this.contract.methods.refundAndFinalize \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:284_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L284)

Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.

**`returns`** A CeloTransactionObject

#### Type declaration:

▸ \(\): _CeloTransactionObject‹void›_

### revokeReleasing

• **revokeReleasing**: _function_ = proxySend\( this.kit, this.contract.methods.revoke \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:275_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L275)

Revoke a Release schedule

**`returns`** A CeloTransactionObject

#### Type declaration:

▸ \(\): _CeloTransactionObject‹void›_

### setAccount

• **setAccount**: _function_ = proxySend\(this.kit, this.contract.methods.setAccount\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:395_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L395)

Beneficiary creates an account on behalf of the ReleaseGold contract.

**`param`** The name to set

**`param`** The key to set

**`param`** The address to set

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setAccountDataEncryptionKey

• **setAccountDataEncryptionKey**: _function_ = proxySend\( this.kit, this.contract.methods.setAccountDataEncryptionKey \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:419_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L419)

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setAccountMetadataURL

• **setAccountMetadataURL**: _function_ = proxySend\(this.kit, this.contract.methods.setAccountMetadataURL\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:407_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L407)

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setAccountName

• **setAccountName**: _function_ = proxySend\(this.kit, this.contract.methods.setAccountName\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:401_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L401)

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setAccountWalletAddress

• **setAccountWalletAddress**: _function_ = proxySend\(this.kit, this.contract.methods.setAccountWalletAddress\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:413_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L413)

Sets the wallet address for the account

**`param`** The address to set

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setBeneficiary

• **setBeneficiary**: _function_ = proxySend\(this.kit, this.contract.methods.setBeneficiary\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:443_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L443)

Sets the contract's beneficiary

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setCanExpire

• **setCanExpire**: _function_ = proxySend\(this.kit, this.contract.methods.setCanExpire\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:433_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L433)

Sets the contract's `canExpire` field to `_canExpire`

**`param`** If the contract can expire `EXPIRATION_TIME` after the release schedule finishes.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setLiquidityProvision

• **setLiquidityProvision**: _function_ = proxySend\(this.kit, this.contract.methods.setLiquidityProvision\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:427_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L427)

Sets the contract's liquidity provision to true

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setMaxDistribution

• **setMaxDistribution**: _function_ = proxySend\(this.kit, this.contract.methods.setMaxDistribution\)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:438_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L438)

Sets the contract's max distribution

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transfer

• **transfer**: _function_ = proxySend\( this.kit, this.contract.methods.transfer, tupleParser\(stringIdentity, valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:299_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L299)

#### Type declaration:

▸ \(`to`: Address, `value`: BigNumber.Value\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `to` | Address |
| `value` | BigNumber.Value |

### unlockGold

• **unlockGold**: _function_ = proxySend\( this.kit, this.contract.methods.unlockGold, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:309_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L309)

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock

#### Type declaration:

▸ \(`value`: BigNumber.Value\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

### withdraw

• **withdraw**: _function_ = proxySend\( this.kit, this.contract.methods.withdraw, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:378_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L378)

Transfer released gold from the ReleaseGold instance back to beneficiary.

**`param`** The requested gold amount

#### Type declaration:

▸ \(`value`: BigNumber.Value\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

### withdrawLockedGold

• **withdrawLockedGold**: _function_ = proxySend\( this.kit, this.contract.methods.withdrawLockedGold, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:368_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L368)

Withdraw gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**`param`** The index of the pending locked gold withdrawal

#### Type declaration:

▸ \(`index`: BigNumber.Value\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `index` | BigNumber.Value |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### authorizeAttestationSigner

▸ **authorizeAttestationSigner**\(`signer`: Address, `proofOfSigningKeyPossession`: Signature\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:561_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L561)

Authorizes an address to sign attestation messages on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | Address | The address of the attestation signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

A CeloTransactionObject

### authorizeValidatorSigner

▸ **authorizeValidatorSigner**\(`signer`: Address, `proofOfSigningKeyPossession`: Signature\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:472_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L472)

Authorizes an address to sign validation messages on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | Address | The address of the validator signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

A CeloTransactionObject

### authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**\(`signer`: Address, `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:523_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L523)

Authorizes an address to sign consensus messages on behalf of the contract's account. Also switch BLS key at the same time.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | Address | The address of the signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The contract's account address signed by the signer address. |
| `blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
| `blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

A CeloTransactionObject

### authorizeVoteSigner

▸ **authorizeVoteSigner**\(`signer`: Address, `proofOfSigningKeyPossession`: Signature\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:451_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L451)

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | Address | The address of the vote signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

A CeloTransactionObject

### getHumanReadableReleaseSchedule

▸ **getHumanReadableReleaseSchedule**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:86_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L86)

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** _Promise‹object›_

A ReleaseSchedule.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹ReleaseGold›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹ReleaseGold› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getReleaseSchedule

▸ **getReleaseSchedule**\(\): _Promise‹ReleaseSchedule›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L70)

Returns the underlying Release schedule of the ReleaseGold contract

**Returns:** _Promise‹ReleaseSchedule›_

A ReleaseSchedule.

### getReleasedBalanceAtRevoke

▸ **getReleasedBalanceAtRevoke**\(\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:216_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L216)

Returns the balance of released gold when the grant was revoked

**Returns:** _Promise‹string›_

The balance at revocation time. 0 can also indicate not revoked.

### getRevocationInfo

▸ **getRevocationInfo**\(\): _Promise‹RevocationInfo›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:166_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L166)

Returns the underlying Revocation Info of the ReleaseGold contract

**Returns:** _Promise‹RevocationInfo›_

A RevocationInfo struct.

### getRevokeTime

▸ **getRevokeTime**\(\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:207_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L207)

Returns the time at which the release schedule was revoked

**Returns:** _Promise‹number›_

The timestamp of the release schedule revocation

### isRevocable

▸ **isRevocable**\(\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:192_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L192)

Indicates if the release grant is revocable or not

**Returns:** _Promise‹boolean›_

A boolean indicating revocable releasing \(true\) or non-revocable\(false\).

### relockGold

▸ **relockGold**\(`value`: BigNumber.Value\): _Promise‹Array‹CeloTransactionObject‹void›››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:320_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L320)

Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `value` | BigNumber.Value | The value to relock from the specified pending withdrawal. |

**Returns:** _Promise‹Array‹CeloTransactionObject‹void›››_

### revoke

▸ **revoke**\(`account`: Address, `group`: Address, `value`: BigNumber\): _Promise‹Array‹CeloTransactionObject‹void›››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:626_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L626)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `group` | Address |
| `value` | BigNumber |

**Returns:** _Promise‹Array‹CeloTransactionObject‹void›››_

### revokeActive

▸ **revokeActive**\(`account`: Address, `group`: Address, `value`: BigNumber\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:607_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L607)

Revokes active votes

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | Address | The account to revoke from. |
| `group` | Address | - |
| `value` | BigNumber | The amount of gold to revoke. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### revokePending

▸ **revokePending**\(`account`: Address, `group`: Address, `value`: BigNumber\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/ReleaseGold.ts:582_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/ReleaseGold.ts#L582)

Revokes pending votes

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | Address | The account to revoke from. |
| `group` | Address | - |
| `value` | BigNumber | The amount of gold to revoke. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

