# Class: AccountsWrapper

Contract for handling deposits needed for voting.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Accounts›

  ↳ **AccountsWrapper**

## Index

### Constructors

* [constructor](_wrappers_accounts_.accountswrapper.md#constructor)

### Properties

* [createAccount](_wrappers_accounts_.accountswrapper.md#createaccount)
* [getAttestationSigner](_wrappers_accounts_.accountswrapper.md#getattestationsigner)
* [getDataEncryptionKey](_wrappers_accounts_.accountswrapper.md#getdataencryptionkey)
* [getMetadataURL](_wrappers_accounts_.accountswrapper.md#getmetadataurl)
* [getValidatorSigner](_wrappers_accounts_.accountswrapper.md#getvalidatorsigner)
* [getVoteSigner](_wrappers_accounts_.accountswrapper.md#getvotesigner)
* [getWalletAddress](_wrappers_accounts_.accountswrapper.md#getwalletaddress)
* [isAccount](_wrappers_accounts_.accountswrapper.md#isaccount)
* [isSigner](_wrappers_accounts_.accountswrapper.md#issigner)
* [setAccount](_wrappers_accounts_.accountswrapper.md#setaccount)
* [setAccountDataEncryptionKey](_wrappers_accounts_.accountswrapper.md#setaccountdataencryptionkey)
* [setMetadataURL](_wrappers_accounts_.accountswrapper.md#setmetadataurl)
* [setName](_wrappers_accounts_.accountswrapper.md#setname)
* [setWalletAddress](_wrappers_accounts_.accountswrapper.md#setwalletaddress)
* [validatorSignerToAccount](_wrappers_accounts_.accountswrapper.md#validatorsignertoaccount)
* [voteSignerToAccount](_wrappers_accounts_.accountswrapper.md#votesignertoaccount)

### Accessors

* [address](_wrappers_accounts_.accountswrapper.md#address)

### Methods

* [authorizeAttestationSigner](_wrappers_accounts_.accountswrapper.md#authorizeattestationsigner)
* [authorizeValidatorSigner](_wrappers_accounts_.accountswrapper.md#authorizevalidatorsigner)
* [authorizeVoteSigner](_wrappers_accounts_.accountswrapper.md#authorizevotesigner)
* [generateProofOfSigningKeyPossession](_wrappers_accounts_.accountswrapper.md#generateproofofsigningkeypossession)
* [generateProofOfSigningKeyPossessionLocally](_wrappers_accounts_.accountswrapper.md#generateproofofsigningkeypossessionlocally)
* [getAccountSummary](_wrappers_accounts_.accountswrapper.md#getaccountsummary)
* [getName](_wrappers_accounts_.accountswrapper.md#getname)
* [parseSignatureOfAddress](_wrappers_accounts_.accountswrapper.md#parsesignatureofaddress)
* [signerToAccount](_wrappers_accounts_.accountswrapper.md#signertoaccount)

## Constructors

###  constructor

\+ **new AccountsWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Accounts): *[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Accounts |

**Returns:** *[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)*

## Properties

###  createAccount

• **createAccount**: *function* = proxySend(this.kit, this.contract.methods.createAccount)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L42)*

Creates an account.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getAttestationSigner

• **getAttestationSigner**: *function* = proxyCall(
    this.contract.methods.getAttestationSigner
  )

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L49)*

Returns the attestation signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can vote.

#### Type declaration:

▸ (`account`: string): *Promise‹[Address](../modules/_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  getDataEncryptionKey

• **getDataEncryptionKey**: *function* = proxyCall(this.contract.methods.getDataEncryptionKey)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:254](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L254)*

Returns the set data encryption key for the account

**`param`** Account

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getMetadataURL

• **getMetadataURL**: *function* = proxyCall(this.contract.methods.getMetadataURL)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:266](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L266)*

Returns the metadataURL for the account

**`param`** Account

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getValidatorSigner

• **getValidatorSigner**: *function* = proxyCall(
    this.contract.methods.getValidatorSigner
  )

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L65)*

Returns the validator signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can register a validator or group.

#### Type declaration:

▸ (`account`: string): *Promise‹[Address](../modules/_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  getVoteSigner

• **getVoteSigner**: *function* = proxyCall(
    this.contract.methods.getVoteSigner
  )

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L57)*

Returns the vote signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can vote.

#### Type declaration:

▸ (`account`: string): *Promise‹[Address](../modules/_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  getWalletAddress

• **getWalletAddress**: *function* = proxyCall(this.contract.methods.getWalletAddress)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:260](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L260)*

Returns the set wallet address for the account

**`param`** Account

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isAccount

• **isAccount**: *function* = proxyCall(this.contract.methods.isAccount)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L104)*

Check if an account already exists.

**`param`** The address of the account

**`returns`** Returns `true` if account exists. Returns `false` otherwise.

#### Type declaration:

▸ (`account`: string): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  isSigner

• **isSigner**: *function* = proxyCall(
    this.contract.methods.isAuthorizedSigner
  )

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L111)*

Check if an address is a signer address

**`param`** The address of the account

**`returns`** Returns `true` if account exists. Returns `false` otherwise.

#### Type declaration:

▸ (`address`: string): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

___

###  setAccount

• **setAccount**: *function* = proxySend(this.kit, this.contract.methods.setAccount)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:283](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L283)*

Convenience Setter for the dataEncryptionKey and wallet address for an account

**`param`** A string to set as the name of the account

**`param`** secp256k1 public key for data encryption. Preferably compressed.

**`param`** The wallet address to set for the account

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

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:272](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L272)*

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setMetadataURL

• **setMetadataURL**: *function* = proxySend(this.kit, this.contract.methods.setMetadataURL)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:295](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L295)*

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setName

• **setName**: *function* = proxySend(this.kit, this.contract.methods.setName)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:289](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L289)*

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setWalletAddress

• **setWalletAddress**: *function* = proxySend(this.kit, this.contract.methods.setWalletAddress)

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:301](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L301)*

Sets the wallet address for the account

**`param`** The address to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  validatorSignerToAccount

• **validatorSignerToAccount**: *function* = proxyCall(
    this.contract.methods.validatorSignerToAccount
  )

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L83)*

Returns the account address given the signer for validating

**`param`** Address that is authorized to sign the tx as validator

**`returns`** The Account address

#### Type declaration:

▸ (`signer`: [Address](../modules/_base_.md#address)): *Promise‹[Address](../modules/_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_base_.md#address) |

___

###  voteSignerToAccount

• **voteSignerToAccount**: *function* = proxyCall(
    this.contract.methods.voteSignerToAccount
  )

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L74)*

Returns the account address given the signer for voting

**`param`** Address that is authorized to sign the tx as voter

**`returns`** The Account address

#### Type declaration:

▸ (`signer`: [Address](../modules/_base_.md#address)): *Promise‹[Address](../modules/_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_base_.md#address) |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L18)*

Contract address

**Returns:** *string*

## Methods

###  authorizeAttestationSigner

▸ **authorizeAttestationSigner**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L144)*

Authorize an attestation signing key on behalf of this account to another address.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSigner

▸ **authorizeValidatorSigner**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L185)*

Authorizes an address to sign consensus messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeVoteSigner

▸ **authorizeVoteSigner**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:164](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L164)*

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the vote signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  generateProofOfSigningKeyPossession

▸ **generateProofOfSigningKeyPossession**(`account`: [Address](../modules/_base_.md#address), `signer`: [Address](../modules/_base_.md#address)): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:224](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L224)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`signer` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹object›*

___

###  generateProofOfSigningKeyPossessionLocally

▸ **generateProofOfSigningKeyPossessionLocally**(`account`: [Address](../modules/_base_.md#address), `signer`: [Address](../modules/_base_.md#address), `privateKey`: string): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:232](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L232)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`signer` | [Address](../modules/_base_.md#address) |
`privateKey` | string |

**Returns:** *Promise‹object›*

___

###  getAccountSummary

▸ **getAccountSummary**(`account`: string): *Promise‹AccountSummary›*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹AccountSummary›*

___

###  getName

▸ **getName**(`account`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹string›*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:245](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L245)*

Returns the set name for the account

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_base_.md#address) | Account |
`blockNumber?` | undefined &#124; number | Height of result, defaults to tip.  |

**Returns:** *Promise‹string›*

___

###  parseSignatureOfAddress

▸ **parseSignatureOfAddress**(`address`: [Address](../modules/_base_.md#address), `signer`: string, `signature`: string): *object*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:303](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L303)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`signer` | string |
`signature` | string |

**Returns:** *object*

* **r**: *string*

* **s**: *string*

* **v**: *number*

___

###  signerToAccount

▸ **signerToAccount**(`signer`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[Address](../modules/_base_.md#address)›*

*Defined in [packages/contractkit/src/wrappers/Accounts.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L94)*

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the account or previously authorized signer. |
`blockNumber?` | undefined &#124; number | Height of result, defaults to tip. |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)›*

The associated account.
