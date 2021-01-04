# MetaTransactionWalletWrapper

Class that wraps the MetaTransactionWallet

## Hierarchy

* [BaseWrapper]()‹MetaTransactionWallet›

  ↳ **MetaTransactionWalletWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [\_chainId]()
* [\_signer]()
* [eip712DomainSeparator]()
* [eventTypes]()
* [events]()
* [getMetaTransactionDigest]()
* [getMetaTransactionSigner]()
* [isOwner]()
* [methodIds]()
* [nonce]()
* [setEip712DomainSeparator]()
* [setSigner]()
* [transferOwnership]()

### Accessors

* [address]()

### Methods

* [executeMetaTransaction]()
* [executeTransaction]()
* [executeTransactions]()
* [getPastEvents]()
* [signAndExecuteMetaTransaction]()
* [signMetaTransaction]()
* [signer]()

## Constructors

### constructor

+ **new MetaTransactionWalletWrapper**\(`kit`: [ContractKit](), `contract`: MetaTransactionWallet\): [_MetaTransactionWalletWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | MetaTransactionWallet |

**Returns:** [_MetaTransactionWalletWrapper_]()

## Properties

### `Optional` \_chainId

• **\_chainId**? : _undefined \| number_

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:185_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L185)

Get and cache the chain ID -- assume it's static for a kit instance

**`returns`** chainId

### `Optional` \_signer

• **\_signer**? : [_Address_](_base_.md#address)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:197_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L197)

Get an cache the signer - it should be static for a Wallet instance

**`returns`** signer

### eip712DomainSeparator

• **eip712DomainSeparator**: _function_ = proxyCall\(this.contract.methods.eip712DomainSeparator\)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:161_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L161)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _object_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

#### Type declaration:

### events

• **events**: _MetaTransactionWallet\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### getMetaTransactionDigest

• **getMetaTransactionDigest**: _function_ = proxyCall\( this.contract.methods.getMetaTransactionDigest, this.getMetaTransactionDigestParams, stringIdentity \)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L133)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getMetaTransactionSigner

• **getMetaTransactionSigner**: _function_ = proxyCall\( this.contract.methods.getMetaTransactionSigner, this.getMetaTransactionSignerParams, stringIdentity \)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:155_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L155)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isOwner

• **isOwner**: _function_ = proxyCall\(this.contract.methods.isOwner\)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:162_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L162)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### methodIds

• **methodIds**: _object_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

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

#### Type declaration:

### nonce

• **nonce**: _function_ = proxyCall\(this.contract.methods.nonce, undefined, valueToInt\)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:163_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L163)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setEip712DomainSeparator

• **setEip712DomainSeparator**: _function_ = proxySend\( this.kit, this.contract.methods.setEip712DomainSeparator \)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:176_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L176)

#### Type declaration:

▸ \(\): [_CeloTransactionObject_]()_‹void›_

### setSigner

• **setSigner**: _function_ = proxySend\( this.kit, this.contract.methods.setSigner \)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:171_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L171)

#### Type declaration:

▸ \(`newSigner`: [Address](_base_.md#address)\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `newSigner` | [Address](_base_.md#address) |

### transferOwnership

• **transferOwnership**: _function_ = proxySend\( this.kit, this.contract.methods.transferOwnership \)

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:166_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L166)

#### Type declaration:

▸ \(`newOwner`: [Address](_base_.md#address)\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `newOwner` | [Address](_base_.md#address) |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### executeMetaTransaction

▸ **executeMetaTransaction**\(`tx`: [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›, `signature`: Signature\): [_CeloTransactionObject_]()_‹string›_

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L74)

Execute a signed meta transaction Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput |
| `signature` | Signature | a Signature |

**Returns:** [_CeloTransactionObject_]()_‹string›_

### executeTransaction

▸ **executeTransaction**\(`tx`: [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›\): [_CeloTransactionObject_]()_‹string›_

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L44)

Execute a transaction originating from the MTW Reverts if the caller is not a signer

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput |

**Returns:** [_CeloTransactionObject_]()_‹string›_

### executeTransactions

▸ **executeTransactions**\(`txs`: Array‹[TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any››\): [_CeloTransactionObject_]()_‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L57)

Execute a batch of transactions originating from the MTW Reverts if the caller is not a signer

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txs` | Array‹[TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›› | An array of TransactionInput |

**Returns:** [_CeloTransactionObject_]()_‹object›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹MetaTransactionWallet›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹MetaTransactionWallet› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### signAndExecuteMetaTransaction

▸ **signAndExecuteMetaTransaction**\(`tx`: [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›\): _Promise‹_[_CeloTransactionObject_]()_‹string››_

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L118)

Execute a signed meta transaction Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹string››_

### signMetaTransaction

▸ **signMetaTransaction**\(`tx`: [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any›, `nonce?`: undefined \| number\): _Promise‹Signature›_

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L99)

Signs a meta transaction as EIP712 typed data

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionWrapper |
| `nonce?` | undefined \| number | Optional -- will query contract state if not passed |

**Returns:** _Promise‹Signature›_

signature a Signature

### signer

▸ **signer**\(\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/wrappers/MetaTransactionWallet.ts:198_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L198)

**Returns:** _Promise‹string›_

