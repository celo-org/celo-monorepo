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
* [setAccountDataEncryptionKey](_wrappers_accounts_.accountswrapper.md#setaccountdataencryptionkey)
* [setMetadataURL](_wrappers_accounts_.accountswrapper.md#setmetadataurl)
* [setName](_wrappers_accounts_.accountswrapper.md#setname)
* [validatorSignerToAccount](_wrappers_accounts_.accountswrapper.md#validatorsignertoaccount)
* [voteSignerToAccount](_wrappers_accounts_.accountswrapper.md#votesignertoaccount)

### Accessors

* [address](_wrappers_accounts_.accountswrapper.md#address)

### Methods

* [authorizeAttestationSigner](_wrappers_accounts_.accountswrapper.md#authorizeattestationsigner)
* [authorizeValidatorSigner](_wrappers_accounts_.accountswrapper.md#authorizevalidatorsigner)
* [authorizeValidatorSignerAndBls](_wrappers_accounts_.accountswrapper.md#authorizevalidatorsignerandbls)
* [authorizeVoteSigner](_wrappers_accounts_.accountswrapper.md#authorizevotesigner)
* [generateProofOfKeyPossession](_wrappers_accounts_.accountswrapper.md#generateproofofkeypossession)
* [generateProofOfKeyPossessionLocally](_wrappers_accounts_.accountswrapper.md#generateproofofkeypossessionlocally)
* [getAccountSummary](_wrappers_accounts_.accountswrapper.md#getaccountsummary)
* [getName](_wrappers_accounts_.accountswrapper.md#getname)
* [parseSignatureOfAddress](_wrappers_accounts_.accountswrapper.md#parsesignatureofaddress)
* [setAccount](_wrappers_accounts_.accountswrapper.md#setaccount)
* [setWalletAddress](_wrappers_accounts_.accountswrapper.md#setwalletaddress)
* [signerToAccount](_wrappers_accounts_.accountswrapper.md#signertoaccount)

## Constructors

###  constructor

\+ **new AccountsWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Accounts): *[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Accounts |

**Returns:** *[AccountsWrapper](_wrappers_accounts_.accountswrapper.md)*

## Properties

###  createAccount

• **createAccount**: *function* = proxySend(this.kit, this.contract.methods.createAccount)

*Defined in [contractkit/src/wrappers/Accounts.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L42)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L49)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:288](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L288)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:300](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L300)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L65)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L57)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:294](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L294)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L104)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L111)*

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

###  setAccountDataEncryptionKey

• **setAccountDataEncryptionKey**: *function* = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )

*Defined in [contractkit/src/wrappers/Accounts.ts:306](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L306)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:363](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L363)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:357](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L357)*

Sets the name for the account

**`param`** The name to set

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

*Defined in [contractkit/src/wrappers/Accounts.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L83)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L74)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

Contract address

**Returns:** *string*

## Methods

###  authorizeAttestationSigner

▸ **authorizeAttestationSigner**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Accounts.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L144)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L185)*

Authorizes an address to sign consensus messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Accounts.ts:233](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L233)*

Authorizes an address to sign consensus messages on behalf of the account. Also switch BLS key at the same time.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |
`blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
`blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeVoteSigner

▸ **authorizeVoteSigner**(`signer`: [Address](../modules/_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Accounts.ts:164](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L164)*

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the vote signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  generateProofOfKeyPossession

▸ **generateProofOfKeyPossession**(`account`: [Address](../modules/_base_.md#address), `signer`: [Address](../modules/_base_.md#address)): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Accounts.ts:262](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L262)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`signer` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹object›*

___

###  generateProofOfKeyPossessionLocally

▸ **generateProofOfKeyPossessionLocally**(`account`: [Address](../modules/_base_.md#address), `signer`: [Address](../modules/_base_.md#address), `privateKey`: string): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Accounts.ts:270](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L270)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹AccountSummary›*

___

###  getName

▸ **getName**(`account`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹string›*

*Defined in [contractkit/src/wrappers/Accounts.ts:279](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L279)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:391](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L391)*

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

###  setAccount

▸ **setAccount**(`name`: string, `dataEncryptionKey`: string, `walletAddress`: [Address](../modules/_base_.md#address), `proofOfPossession`: Signature | null): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [contractkit/src/wrappers/Accounts.ts:318](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L318)*

Convenience Setter for the dataEncryptionKey and wallet address for an account

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`name` | string | - | A string to set as the name of the account |
`dataEncryptionKey` | string | - | secp256k1 public key for data encryption. Preferably compressed. |
`walletAddress` | [Address](../modules/_base_.md#address) | - | The wallet address to set for the account |
`proofOfPossession` | Signature &#124; null | null | Signature from the wallet address key over the sender's address  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  setWalletAddress

▸ **setWalletAddress**(`walletAddress`: [Address](../modules/_base_.md#address), `proofOfPossession`: Signature | null): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [contractkit/src/wrappers/Accounts.ts:369](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L369)*

Sets the wallet address for the account

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`walletAddress` | [Address](../modules/_base_.md#address) | - |
`proofOfPossession` | Signature &#124; null | null |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  signerToAccount

▸ **signerToAccount**(`signer`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[Address](../modules/_base_.md#address)›*

*Defined in [contractkit/src/wrappers/Accounts.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L94)*

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_base_.md#address) | The address of the account or previously authorized signer. |
`blockNumber?` | undefined &#124; number | Height of result, defaults to tip. |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)›*

The associated account.
