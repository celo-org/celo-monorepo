# Class: AccountsWrapper

Contract for handling deposits needed for voting.

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹Accounts›

  ↳ **AccountsWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_accounts_.accountswrapper.md#constructor)

### Properties

* [createAccount](_contractkit_src_wrappers_accounts_.accountswrapper.md#createaccount)
* [events](_contractkit_src_wrappers_accounts_.accountswrapper.md#events)
* [getAttestationSigner](_contractkit_src_wrappers_accounts_.accountswrapper.md#getattestationsigner)
* [getDataEncryptionKey](_contractkit_src_wrappers_accounts_.accountswrapper.md#getdataencryptionkey)
* [getMetadataURL](_contractkit_src_wrappers_accounts_.accountswrapper.md#getmetadataurl)
* [getValidatorSigner](_contractkit_src_wrappers_accounts_.accountswrapper.md#getvalidatorsigner)
* [getVoteSigner](_contractkit_src_wrappers_accounts_.accountswrapper.md#getvotesigner)
* [getWalletAddress](_contractkit_src_wrappers_accounts_.accountswrapper.md#getwalletaddress)
* [hasAuthorizedAttestationSigner](_contractkit_src_wrappers_accounts_.accountswrapper.md#hasauthorizedattestationsigner)
* [isAccount](_contractkit_src_wrappers_accounts_.accountswrapper.md#isaccount)
* [isSigner](_contractkit_src_wrappers_accounts_.accountswrapper.md#issigner)
* [setAccountDataEncryptionKey](_contractkit_src_wrappers_accounts_.accountswrapper.md#setaccountdataencryptionkey)
* [setMetadataURL](_contractkit_src_wrappers_accounts_.accountswrapper.md#setmetadataurl)
* [setName](_contractkit_src_wrappers_accounts_.accountswrapper.md#setname)
* [signerToAccount](_contractkit_src_wrappers_accounts_.accountswrapper.md#signertoaccount)
* [validatorSignerToAccount](_contractkit_src_wrappers_accounts_.accountswrapper.md#validatorsignertoaccount)
* [voteSignerToAccount](_contractkit_src_wrappers_accounts_.accountswrapper.md#votesignertoaccount)

### Accessors

* [address](_contractkit_src_wrappers_accounts_.accountswrapper.md#address)

### Methods

* [authorizeAttestationSigner](_contractkit_src_wrappers_accounts_.accountswrapper.md#authorizeattestationsigner)
* [authorizeValidatorSigner](_contractkit_src_wrappers_accounts_.accountswrapper.md#authorizevalidatorsigner)
* [authorizeValidatorSignerAndBls](_contractkit_src_wrappers_accounts_.accountswrapper.md#authorizevalidatorsignerandbls)
* [authorizeVoteSigner](_contractkit_src_wrappers_accounts_.accountswrapper.md#authorizevotesigner)
* [generateProofOfKeyPossession](_contractkit_src_wrappers_accounts_.accountswrapper.md#generateproofofkeypossession)
* [generateProofOfKeyPossessionLocally](_contractkit_src_wrappers_accounts_.accountswrapper.md#generateproofofkeypossessionlocally)
* [getAccountSummary](_contractkit_src_wrappers_accounts_.accountswrapper.md#getaccountsummary)
* [getCurrentSigners](_contractkit_src_wrappers_accounts_.accountswrapper.md#getcurrentsigners)
* [getName](_contractkit_src_wrappers_accounts_.accountswrapper.md#getname)
* [getPastEvents](_contractkit_src_wrappers_accounts_.accountswrapper.md#getpastevents)
* [parseSignatureOfAddress](_contractkit_src_wrappers_accounts_.accountswrapper.md#parsesignatureofaddress)
* [setAccount](_contractkit_src_wrappers_accounts_.accountswrapper.md#setaccount)
* [setWalletAddress](_contractkit_src_wrappers_accounts_.accountswrapper.md#setwalletaddress)

## Constructors

###  constructor

\+ **new AccountsWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: Accounts): *[AccountsWrapper](_contractkit_src_wrappers_accounts_.accountswrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | Accounts |

**Returns:** *[AccountsWrapper](_contractkit_src_wrappers_accounts_.accountswrapper.md)*

## Properties

###  createAccount

• **createAccount**: *function* = proxySend(this.kit, this.contract.methods.createAccount)

*Defined in [contractkit/src/wrappers/Accounts.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L41)*

Creates an account.

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

###  getAttestationSigner

• **getAttestationSigner**: *function* = proxyCall(
    this.contract.methods.getAttestationSigner
  )

*Defined in [contractkit/src/wrappers/Accounts.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L48)*

Returns the attestation signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can vote.

#### Type declaration:

▸ (`account`: string): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  getDataEncryptionKey

• **getDataEncryptionKey**: *function* = proxyCall(this.contract.methods.getDataEncryptionKey, undefined, (res) =>
    solidityBytesToString(res)
  )

*Defined in [contractkit/src/wrappers/Accounts.ts:304](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L304)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:318](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L318)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L74)*

Returns the validator signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can register a validator or group.

#### Type declaration:

▸ (`account`: string): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  getVoteSigner

• **getVoteSigner**: *function* = proxyCall(
    this.contract.methods.getVoteSigner
  )

*Defined in [contractkit/src/wrappers/Accounts.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L66)*

Returns the vote signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can vote.

#### Type declaration:

▸ (`account`: string): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  getWalletAddress

• **getWalletAddress**: *function* = proxyCall(this.contract.methods.getWalletAddress)

*Defined in [contractkit/src/wrappers/Accounts.ts:312](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L312)*

Returns the set wallet address for the account

**`param`** Account

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  hasAuthorizedAttestationSigner

• **hasAuthorizedAttestationSigner**: *function* = proxyCall(
    this.contract.methods.hasAuthorizedAttestationSigner
  )

*Defined in [contractkit/src/wrappers/Accounts.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L57)*

Returns if the account has authorized an attestation signer

**`param`** The address of the account.

**`returns`** If the account has authorized an attestation signer

#### Type declaration:

▸ (`account`: string): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  isAccount

• **isAccount**: *function* = proxyCall(this.contract.methods.isAccount)

*Defined in [contractkit/src/wrappers/Accounts.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L111)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L118)*

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

*Defined in [contractkit/src/wrappers/Accounts.ts:324](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L324)*

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setMetadataURL

• **setMetadataURL**: *function* = proxySend(this.kit, this.contract.methods.setMetadataURL)

*Defined in [contractkit/src/wrappers/Accounts.ts:381](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L381)*

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setName

• **setName**: *function* = proxySend(this.kit, this.contract.methods.setName)

*Defined in [contractkit/src/wrappers/Accounts.ts:375](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L375)*

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  signerToAccount

• **signerToAccount**: *function* = proxyCall(
    this.contract.methods.signerToAccount
  )

*Defined in [contractkit/src/wrappers/Accounts.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L102)*

Returns the account associated with `signer`.

**`param`** The address of the account or previously authorized signer.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**`returns`** The associated account.

#### Type declaration:

▸ (`signer`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  validatorSignerToAccount

• **validatorSignerToAccount**: *function* = proxyCall(
    this.contract.methods.validatorSignerToAccount
  )

*Defined in [contractkit/src/wrappers/Accounts.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L92)*

Returns the account address given the signer for validating

**`param`** Address that is authorized to sign the tx as validator

**`returns`** The Account address

#### Type declaration:

▸ (`signer`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  voteSignerToAccount

• **voteSignerToAccount**: *function* = proxyCall(
    this.contract.methods.voteSignerToAccount
  )

*Defined in [contractkit/src/wrappers/Accounts.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L83)*

Returns the account address given the signer for voting

**`param`** Address that is authorized to sign the tx as voter

**`returns`** The Account address

#### Type declaration:

▸ (`signer`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) |

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

*Defined in [contractkit/src/wrappers/Accounts.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L160)*

Authorize an attestation signing key on behalf of this account to another address.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSigner

▸ **authorizeValidatorSigner**(`signer`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Accounts.ts:201](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L201)*

Authorizes an address to sign consensus messages on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**(`signer`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Accounts.ts:249](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L249)*

Authorizes an address to sign consensus messages on behalf of the account. Also switch BLS key at the same time.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |
`blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
`blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  authorizeVoteSigner

▸ **authorizeVoteSigner**(`signer`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfSigningKeyPossession`: Signature): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Accounts.ts:180](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L180)*

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the vote signing key to authorize. |
`proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

A CeloTransactionObject

___

###  generateProofOfKeyPossession

▸ **generateProofOfKeyPossession**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `signer`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Accounts.ts:278](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L278)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹object›*

___

###  generateProofOfKeyPossessionLocally

▸ **generateProofOfKeyPossessionLocally**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `signer`: [Address](../modules/_contractkit_src_base_.md#address), `privateKey`: string): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Accounts.ts:286](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L286)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) |
`privateKey` | string |

**Returns:** *Promise‹object›*

___

###  getAccountSummary

▸ **getAccountSummary**(`account`: string): *Promise‹AccountSummary›*

*Defined in [contractkit/src/wrappers/Accounts.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L130)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹AccountSummary›*

___

###  getCurrentSigners

▸ **getCurrentSigners**(`address`: string): *Promise‹string[]›*

*Defined in [contractkit/src/wrappers/Accounts.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L122)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹string[]›*

___

###  getName

▸ **getName**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber?`: undefined | number): *Promise‹string›*

*Defined in [contractkit/src/wrappers/Accounts.ts:295](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L295)*

Returns the set name for the account

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | Account |
`blockNumber?` | undefined &#124; number | Height of result, defaults to tip.  |

**Returns:** *Promise‹string›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_contractkit_src_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  parseSignatureOfAddress

▸ **parseSignatureOfAddress**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `signer`: string, `signature`: string): *object*

*Defined in [contractkit/src/wrappers/Accounts.ts:409](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L409)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`signer` | string |
`signature` | string |

**Returns:** *object*

* **r**: *string*

* **s**: *string*

* **v**: *number*

___

###  setAccount

▸ **setAccount**(`name`: string, `dataEncryptionKey`: string, `walletAddress`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfPossession`: Signature | null): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [contractkit/src/wrappers/Accounts.ts:336](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L336)*

Convenience Setter for the dataEncryptionKey and wallet address for an account

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`name` | string | - | A string to set as the name of the account |
`dataEncryptionKey` | string | - | secp256k1 public key for data encryption. Preferably compressed. |
`walletAddress` | [Address](../modules/_contractkit_src_base_.md#address) | - | The wallet address to set for the account |
`proofOfPossession` | Signature &#124; null | null | Signature from the wallet address key over the sender's address  |

**Returns:** *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  setWalletAddress

▸ **setWalletAddress**(`walletAddress`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfPossession`: Signature | null): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [contractkit/src/wrappers/Accounts.ts:387](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L387)*

Sets the wallet address for the account

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`walletAddress` | [Address](../modules/_contractkit_src_base_.md#address) | - |
`proofOfPossession` | Signature &#124; null | null |

**Returns:** *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*
