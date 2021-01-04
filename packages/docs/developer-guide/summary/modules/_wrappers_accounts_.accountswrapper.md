# AccountsWrapper

Contract for handling deposits needed for voting.

## Hierarchy

* [BaseWrapper]()‹Accounts›

  ↳ **AccountsWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [createAccount]()
* [eventTypes]()
* [events]()
* [getAttestationSigner]()
* [getDataEncryptionKey]()
* [getMetadataURL]()
* [getValidatorSigner]()
* [getVoteSigner]()
* [getWalletAddress]()
* [hasAuthorizedAttestationSigner]()
* [isAccount]()
* [isSigner]()
* [methodIds]()
* [setAccountDataEncryptionKey]()
* [setMetadataURL]()
* [setName]()
* [signerToAccount]()
* [validatorSignerToAccount]()
* [voteSignerToAccount]()

### Accessors

* [address]()

### Methods

* [authorizeAttestationSigner]()
* [authorizeValidatorSigner]()
* [authorizeValidatorSignerAndBls]()
* [authorizeVoteSigner]()
* [generateProofOfKeyPossession]()
* [generateProofOfKeyPossessionLocally]()
* [getAccountSummary]()
* [getCurrentSigners]()
* [getName]()
* [getPastEvents]()
* [parseSignatureOfAddress]()
* [setAccount]()
* [setWalletAddress]()

## Constructors

### constructor

+ **new AccountsWrapper**\(`kit`: [ContractKit](), `contract`: Accounts\): [_AccountsWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Accounts |

**Returns:** [_AccountsWrapper_]()

## Properties

### createAccount

• **createAccount**: _function_ = proxySend\(this.kit, this.contract.methods.createAccount\)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L41)

Creates an account.

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

• **events**: _Accounts\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### getAttestationSigner

• **getAttestationSigner**: _function_ = proxyCall\( this.contract.methods.getAttestationSigner \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L48)

Returns the attestation signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can vote.

#### Type declaration:

▸ \(`account`: string\): _Promise‹_[_Address_](_base_.md#address)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### getDataEncryptionKey

• **getDataEncryptionKey**: _function_ = proxyCall\(this.contract.methods.getDataEncryptionKey, undefined, \(res\) =&gt; solidityBytesToString\(res\) \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:304_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L304)

Returns the set data encryption key for the account

**`param`** Account

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getMetadataURL

• **getMetadataURL**: _function_ = proxyCall\(this.contract.methods.getMetadataURL\)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:318_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L318)

Returns the metadataURL for the account

**`param`** Account

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getValidatorSigner

• **getValidatorSigner**: _function_ = proxyCall\( this.contract.methods.getValidatorSigner \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L74)

Returns the validator signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can register a validator or group.

#### Type declaration:

▸ \(`account`: string\): _Promise‹_[_Address_](_base_.md#address)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### getVoteSigner

• **getVoteSigner**: _function_ = proxyCall\( this.contract.methods.getVoteSigner \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L66)

Returns the vote signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can vote.

#### Type declaration:

▸ \(`account`: string\): _Promise‹_[_Address_](_base_.md#address)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### getWalletAddress

• **getWalletAddress**: _function_ = proxyCall\(this.contract.methods.getWalletAddress\)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:312_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L312)

Returns the set wallet address for the account

**`param`** Account

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### hasAuthorizedAttestationSigner

• **hasAuthorizedAttestationSigner**: _function_ = proxyCall\( this.contract.methods.hasAuthorizedAttestationSigner \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L57)

Returns if the account has authorized an attestation signer

**`param`** The address of the account.

**`returns`** If the account has authorized an attestation signer

#### Type declaration:

▸ \(`account`: string\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### isAccount

• **isAccount**: _function_ = proxyCall\(this.contract.methods.isAccount\)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L111)

Check if an account already exists.

**`param`** The address of the account

**`returns`** Returns `true` if account exists. Returns `false` otherwise.

#### Type declaration:

▸ \(`account`: string\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### isSigner

• **isSigner**: _function_ = proxyCall\( this.contract.methods.isAuthorizedSigner \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L118)

Check if an address is a signer address

**`param`** The address of the account

**`returns`** Returns `true` if account exists. Returns `false` otherwise.

#### Type declaration:

▸ \(`address`: string\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

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

### setAccountDataEncryptionKey

• **setAccountDataEncryptionKey**: _function_ = proxySend\( this.kit, this.contract.methods.setAccountDataEncryptionKey \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:324_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L324)

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setMetadataURL

• **setMetadataURL**: _function_ = proxySend\(this.kit, this.contract.methods.setMetadataURL\)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:381_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L381)

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setName

• **setName**: _function_ = proxySend\(this.kit, this.contract.methods.setName\)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:375_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L375)

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### signerToAccount

• **signerToAccount**: _function_ = proxyCall\( this.contract.methods.signerToAccount \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L102)

Returns the account associated with `signer`.

**`param`** The address of the account or previously authorized signer.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**`returns`** The associated account.

#### Type declaration:

▸ \(`signer`: [Address](_base_.md#address)\): _Promise‹_[_Address_](_base_.md#address)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | [Address](_base_.md#address) |

### validatorSignerToAccount

• **validatorSignerToAccount**: _function_ = proxyCall\( this.contract.methods.validatorSignerToAccount \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L92)

Returns the account address given the signer for validating

**`param`** Address that is authorized to sign the tx as validator

**`returns`** The Account address

#### Type declaration:

▸ \(`signer`: [Address](_base_.md#address)\): _Promise‹_[_Address_](_base_.md#address)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | [Address](_base_.md#address) |

### voteSignerToAccount

• **voteSignerToAccount**: _function_ = proxyCall\( this.contract.methods.voteSignerToAccount \)

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L83)

Returns the account address given the signer for voting

**`param`** Address that is authorized to sign the tx as voter

**`returns`** The Account address

#### Type declaration:

▸ \(`signer`: [Address](_base_.md#address)\): _Promise‹_[_Address_](_base_.md#address)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | [Address](_base_.md#address) |

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

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:160_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L160)

Authorize an attestation signing key on behalf of this account to another address.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### authorizeValidatorSigner

▸ **authorizeValidatorSigner**\(`signer`: [Address](_base_.md#address), `proofOfSigningKeyPossession`: Signature\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:201_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L201)

Authorizes an address to sign consensus messages on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**\(`signer`: [Address](_base_.md#address), `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:249_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L249)

Authorizes an address to sign consensus messages on behalf of the account. Also switch BLS key at the same time.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |
| `blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
| `blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### authorizeVoteSigner

▸ **authorizeVoteSigner**\(`signer`: [Address](_base_.md#address), `proofOfSigningKeyPossession`: Signature\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:180_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L180)

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [Address](_base_.md#address) | The address of the vote signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

A CeloTransactionObject

### generateProofOfKeyPossession

▸ **generateProofOfKeyPossession**\(`account`: [Address](_base_.md#address), `signer`: [Address](_base_.md#address)\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:278_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L278)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `signer` | [Address](_base_.md#address) |

**Returns:** _Promise‹object›_

### generateProofOfKeyPossessionLocally

▸ **generateProofOfKeyPossessionLocally**\(`account`: [Address](_base_.md#address), `signer`: [Address](_base_.md#address), `privateKey`: string\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:286_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L286)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `signer` | [Address](_base_.md#address) |
| `privateKey` | string |

**Returns:** _Promise‹object›_

### getAccountSummary

▸ **getAccountSummary**\(`account`: string\): _Promise‹AccountSummary›_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:130_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L130)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

**Returns:** _Promise‹AccountSummary›_

### getCurrentSigners

▸ **getCurrentSigners**\(`address`: string\): _Promise‹string\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:122_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L122)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹string\[\]›_

### getName

▸ **getName**\(`account`: [Address](_base_.md#address), `blockNumber?`: undefined \| number\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:295_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L295)

Returns the set name for the account

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | [Address](_base_.md#address) | Account |
| `blockNumber?` | undefined \| number | Height of result, defaults to tip. |

**Returns:** _Promise‹string›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Accounts›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Accounts› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### parseSignatureOfAddress

▸ **parseSignatureOfAddress**\(`address`: [Address](_base_.md#address), `signer`: string, `signature`: string\): _object_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:409_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L409)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |
| `signer` | string |
| `signature` | string |

**Returns:** _object_

* **r**: _string_
* **s**: _string_
* **v**: _number_

### setAccount

▸ **setAccount**\(`name`: string, `dataEncryptionKey`: string, `walletAddress`: [Address](_base_.md#address), `proofOfPossession`: Signature \| null\): [_CeloTransactionObject_]()_‹void›_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:336_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L336)

Convenience Setter for the dataEncryptionKey and wallet address for an account

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | - | A string to set as the name of the account |
| `dataEncryptionKey` | string | - | secp256k1 public key for data encryption. Preferably compressed. |
| `walletAddress` | [Address](_base_.md#address) | - | The wallet address to set for the account |
| `proofOfPossession` | Signature \| null | null | Signature from the wallet address key over the sender's address |

**Returns:** [_CeloTransactionObject_]()_‹void›_

### setWalletAddress

▸ **setWalletAddress**\(`walletAddress`: [Address](_base_.md#address), `proofOfPossession`: Signature \| null\): [_CeloTransactionObject_]()_‹void›_

_Defined in_ [_packages/contractkit/src/wrappers/Accounts.ts:387_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Accounts.ts#L387)

Sets the wallet address for the account

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `walletAddress` | [Address](_base_.md#address) | - |
| `proofOfPossession` | Signature \| null | null |

**Returns:** [_CeloTransactionObject_]()_‹void›_

