# AccountsWrapper

Contract for handling deposits needed for voting.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Accounts›

  ↳ **AccountsWrapper**

## Index

### Constructors

* [constructor](_wrappers_accounts_.accountswrapper.md#constructor)

### Properties

* [createAccount](_wrappers_accounts_.accountswrapper.md#createaccount)
* [eventTypes](_wrappers_accounts_.accountswrapper.md#eventtypes)
* [events](_wrappers_accounts_.accountswrapper.md#events)
* [getAttestationSigner](_wrappers_accounts_.accountswrapper.md#getattestationsigner)
* [getDataEncryptionKey](_wrappers_accounts_.accountswrapper.md#getdataencryptionkey)
* [getMetadataURL](_wrappers_accounts_.accountswrapper.md#getmetadataurl)
* [getValidatorSigner](_wrappers_accounts_.accountswrapper.md#getvalidatorsigner)
* [getVoteSigner](_wrappers_accounts_.accountswrapper.md#getvotesigner)
* [getWalletAddress](_wrappers_accounts_.accountswrapper.md#getwalletaddress)
* [hasAuthorizedAttestationSigner](_wrappers_accounts_.accountswrapper.md#hasauthorizedattestationsigner)
* [isAccount](_wrappers_accounts_.accountswrapper.md#isaccount)
* [isSigner](_wrappers_accounts_.accountswrapper.md#issigner)
* [methodIds](_wrappers_accounts_.accountswrapper.md#methodids)
* [setAccountDataEncryptionKey](_wrappers_accounts_.accountswrapper.md#setaccountdataencryptionkey)
* [setMetadataURL](_wrappers_accounts_.accountswrapper.md#setmetadataurl)
* [setName](_wrappers_accounts_.accountswrapper.md#setname)
* [signerToAccount](_wrappers_accounts_.accountswrapper.md#signertoaccount)
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
* [getCurrentSigners](_wrappers_accounts_.accountswrapper.md#getcurrentsigners)
* [getName](_wrappers_accounts_.accountswrapper.md#getname)
* [getPastEvents](_wrappers_accounts_.accountswrapper.md#getpastevents)
* [parseSignatureOfAddress](_wrappers_accounts_.accountswrapper.md#parsesignatureofaddress)
* [setAccount](_wrappers_accounts_.accountswrapper.md#setaccount)
* [setWalletAddress](_wrappers_accounts_.accountswrapper.md#setwalletaddress)

## Constructors

### constructor

+ **new AccountsWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Accounts\): [_AccountsWrapper_](_wrappers_accounts_.accountswrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | Accounts |

**Returns:** [_AccountsWrapper_](_wrappers_accounts_.accountswrapper.md)

## Properties

### createAccount

• **createAccount**: _function_ = proxySend\(this.kit, this.contract.methods.createAccount\)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L39)

Creates an account.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _Accounts\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getAttestationSigner

• **getAttestationSigner**: _function_ = proxyCall\( this.contract.methods.getAttestationSigner \)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L46)

Returns the attestation signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can vote.

#### Type declaration:

▸ \(`account`: string\): _Promise‹Address›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### getDataEncryptionKey

• **getDataEncryptionKey**: _function_ = proxyCall\(this.contract.methods.getDataEncryptionKey, undefined, \(res\) =&gt; solidityBytesToString\(res\) \)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:310_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L310)

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

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:324_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L324)

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

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L72)

Returns the validator signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can register a validator or group.

#### Type declaration:

▸ \(`account`: string\): _Promise‹Address›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### getVoteSigner

• **getVoteSigner**: _function_ = proxyCall\( this.contract.methods.getVoteSigner \)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L64)

Returns the vote signer for the specified account.

**`param`** The address of the account.

**`returns`** The address with which the account can vote.

#### Type declaration:

▸ \(`account`: string\): _Promise‹Address›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### getWalletAddress

• **getWalletAddress**: _function_ = proxyCall\(this.contract.methods.getWalletAddress\)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:318_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L318)

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

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L55)

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

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:109_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L109)

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

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L116)

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
    methodABI === undefined
      ? '0x'
      : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_methodIds_](_wrappers_basewrapper_.basewrapper.md#methodids)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### setAccountDataEncryptionKey

• **setAccountDataEncryptionKey**: _function_ = proxySend\( this.kit, this.contract.methods.setAccountDataEncryptionKey \)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:330_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L330)

Sets the data encryption of the account

**`param`** The key to set

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setMetadataURL

• **setMetadataURL**: _function_ = proxySend\(this.kit, this.contract.methods.setMetadataURL\)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:387_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L387)

Sets the metadataURL for the account

**`param`** The url to set

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setName

• **setName**: _function_ = proxySend\(this.kit, this.contract.methods.setName\)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:381_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L381)

Sets the name for the account

**`param`** The name to set

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### signerToAccount

• **signerToAccount**: _function_ = proxyCall\( this.contract.methods.signerToAccount \)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L100)

Returns the account associated with `signer`.

**`param`** The address of the account or previously authorized signer.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**`returns`** The associated account.

#### Type declaration:

▸ \(`signer`: Address\): _Promise‹Address›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | Address |

### validatorSignerToAccount

• **validatorSignerToAccount**: _function_ = proxyCall\( this.contract.methods.validatorSignerToAccount \)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L90)

Returns the account address given the signer for validating

**`param`** Address that is authorized to sign the tx as validator

**`returns`** The Account address

#### Type declaration:

▸ \(`signer`: Address\): _Promise‹Address›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | Address |

### voteSignerToAccount

• **voteSignerToAccount**: _function_ = proxyCall\( this.contract.methods.voteSignerToAccount \)

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L81)

Returns the account address given the signer for voting

**`param`** Address that is authorized to sign the tx as voter

**`returns`** The Account address

#### Type declaration:

▸ \(`signer`: Address\): _Promise‹Address›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | Address |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### authorizeAttestationSigner

▸ **authorizeAttestationSigner**\(`signer`: Address, `proofOfSigningKeyPossession`: Signature\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:158_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L158)

Authorize an attestation signing key on behalf of this account to another address.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | Address | The address of the signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

A CeloTransactionObject

### authorizeValidatorSigner

▸ **authorizeValidatorSigner**\(`signer`: Address, `proofOfSigningKeyPossession`: Signature\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:199_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L199)

Authorizes an address to sign consensus messages on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | Address | The address of the signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

A CeloTransactionObject

### authorizeValidatorSignerAndBls

▸ **authorizeValidatorSignerAndBls**\(`signer`: Address, `proofOfSigningKeyPossession`: Signature, `blsPublicKey`: string, `blsPop`: string\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:251_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L251)

Authorizes an address to sign consensus messages on behalf of the account. Also switch BLS key at the same time.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | Address | The address of the signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |
| `blsPublicKey` | string | The BLS public key that the validator is using for consensus, should pass proof   of possession. 48 bytes. |
| `blsPop` | string | The BLS public key proof-of-possession, which consists of a signature on the   account address. 96 bytes. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

A CeloTransactionObject

### authorizeVoteSigner

▸ **authorizeVoteSigner**\(`signer`: Address, `proofOfSigningKeyPossession`: Signature\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:178_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L178)

Authorizes an address to sign votes on behalf of the account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | Address | The address of the vote signing key to authorize. |
| `proofOfSigningKeyPossession` | Signature | The account address signed by the signer address. |

**Returns:** _Promise‹CeloTransactionObject‹void››_

A CeloTransactionObject

### generateProofOfKeyPossession

▸ **generateProofOfKeyPossession**\(`account`: Address, `signer`: Address\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:284_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L284)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `signer` | Address |

**Returns:** _Promise‹object›_

### generateProofOfKeyPossessionLocally

▸ **generateProofOfKeyPossessionLocally**\(`account`: Address, `signer`: Address, `privateKey`: string\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:292_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L292)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `signer` | Address |
| `privateKey` | string |

**Returns:** _Promise‹object›_

### getAccountSummary

▸ **getAccountSummary**\(`account`: string\): _Promise‹AccountSummary›_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L128)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

**Returns:** _Promise‹AccountSummary›_

### getCurrentSigners

▸ **getCurrentSigners**\(`address`: string\): _Promise‹string\[\]›_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L120)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹string\[\]›_

### getName

▸ **getName**\(`account`: Address, `blockNumber?`: undefined \| number\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:301_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L301)

Returns the set name for the account

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | Address | Account |
| `blockNumber?` | undefined \| number | Height of result, defaults to tip. |

**Returns:** _Promise‹string›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Accounts›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Accounts› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### parseSignatureOfAddress

▸ **parseSignatureOfAddress**\(`address`: Address, `signer`: string, `signature`: string\): _object_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:415_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L415)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `signer` | string |
| `signature` | string |

**Returns:** _object_

* **r**: _string_
* **s**: _string_
* **v**: _number_

### setAccount

▸ **setAccount**\(`name`: string, `dataEncryptionKey`: string, `walletAddress`: Address, `proofOfPossession`: Signature \| null\): _CeloTransactionObject‹void›_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:342_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L342)

Convenience Setter for the dataEncryptionKey and wallet address for an account

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | - | A string to set as the name of the account |
| `dataEncryptionKey` | string | - | secp256k1 public key for data encryption. Preferably compressed. |
| `walletAddress` | Address | - | The wallet address to set for the account |
| `proofOfPossession` | Signature \| null | null | Signature from the wallet address key over the sender's address |

**Returns:** _CeloTransactionObject‹void›_

### setWalletAddress

▸ **setWalletAddress**\(`walletAddress`: Address, `proofOfPossession`: Signature \| null\): _CeloTransactionObject‹void›_

_Defined in_ [_contractkit/src/wrappers/Accounts.ts:393_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Accounts.ts#L393)

Sets the wallet address for the account

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `walletAddress` | Address | - |
| `proofOfPossession` | Signature \| null | null |

**Returns:** _CeloTransactionObject‹void›_

