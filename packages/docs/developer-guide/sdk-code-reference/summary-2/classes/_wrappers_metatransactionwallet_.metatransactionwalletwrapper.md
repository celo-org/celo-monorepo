# MetaTransactionWalletWrapper

Class that wraps the MetaTransactionWallet

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹MetaTransactionWallet›

  ↳ **MetaTransactionWalletWrapper**

## Index

### Constructors

* [constructor](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#constructor)

### Properties

* [\_chainId](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#optional-_chainid)
* [\_signer](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#optional-_signer)
* [eip712DomainSeparator](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#eip712domainseparator)
* [eventTypes](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#eventtypes)
* [events](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#events)
* [getMetaTransactionDigest](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getmetatransactiondigest)
* [getMetaTransactionSigner](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getmetatransactionsigner)
* [isOwner](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#isowner)
* [methodIds](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#methodids)
* [nonce](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#nonce)
* [setEip712DomainSeparator](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#seteip712domainseparator)
* [setSigner](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#setsigner)
* [transferOwnership](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#transferownership)

### Accessors

* [address](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#address)

### Methods

* [executeMetaTransaction](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#executemetatransaction)
* [executeTransaction](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#executetransaction)
* [executeTransactions](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#executetransactions)
* [getPastEvents](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getpastevents)
* [signAndExecuteMetaTransaction](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#signandexecutemetatransaction)
* [signMetaTransaction](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#signmetatransaction)
* [signer](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#signer)

## Constructors

### constructor

+ **new MetaTransactionWalletWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MetaTransactionWallet\): [_MetaTransactionWalletWrapper_](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | MetaTransactionWallet |

**Returns:** [_MetaTransactionWalletWrapper_](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

## Properties

### `Optional` \_chainId

• **\_chainId**? : _undefined \| number_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L179)

Get and cache the chain ID -- assume it's static for a kit instance

**`returns`** chainId

### `Optional` \_signer

• **\_signer**? : _Address_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:192_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L192)

Get an cache the signer - it should be static for a Wallet instance

**`returns`** signer

### eip712DomainSeparator

• **eip712DomainSeparator**: _function_ = proxyCall\(this.contract.methods.eip712DomainSeparator\)

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:155_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L155)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _MetaTransactionWallet\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getMetaTransactionDigest

• **getMetaTransactionDigest**: _function_ = proxyCall\( this.contract.methods.getMetaTransactionDigest, this.getMetaTransactionDigestParams, stringIdentity \)

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:127_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L127)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getMetaTransactionSigner

• **getMetaTransactionSigner**: _function_ = proxyCall\( this.contract.methods.getMetaTransactionSigner, this.getMetaTransactionSignerParams, stringIdentity \)

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:149_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L149)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isOwner

• **isOwner**: _function_ = proxyCall\(this.contract.methods.isOwner\)

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:156_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L156)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

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

### nonce

• **nonce**: _function_ = proxyCall\(this.contract.methods.nonce, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L157)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setEip712DomainSeparator

• **setEip712DomainSeparator**: _function_ = proxySend\( this.kit, this.contract.methods.setEip712DomainSeparator \)

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:170_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L170)

#### Type declaration:

▸ \(\): _CeloTransactionObject‹void›_

### setSigner

• **setSigner**: _function_ = proxySend\( this.kit, this.contract.methods.setSigner \)

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:165_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L165)

#### Type declaration:

▸ \(`newSigner`: Address\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `newSigner` | Address |

### transferOwnership

• **transferOwnership**: _function_ = proxySend\( this.kit, this.contract.methods.transferOwnership \)

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:160_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L160)

#### Type declaration:

▸ \(`newOwner`: Address\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `newOwner` | Address |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### executeMetaTransaction

▸ **executeMetaTransaction**\(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›, `signature`: Signature\): _CeloTransactionObject‹string›_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L68)

Execute a signed meta transaction Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput |
| `signature` | Signature | a Signature |

**Returns:** _CeloTransactionObject‹string›_

### executeTransaction

▸ **executeTransaction**\(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›\): _CeloTransactionObject‹string›_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L38)

Execute a transaction originating from the MTW Reverts if the caller is not a signer

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput |

**Returns:** _CeloTransactionObject‹string›_

### executeTransactions

▸ **executeTransactions**\(`txs`: Array‹[TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any››\): _CeloTransactionObject‹object›_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L51)

Execute a batch of transactions originating from the MTW Reverts if the caller is not a signer

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txs` | Array‹[TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›› | An array of TransactionInput |

**Returns:** _CeloTransactionObject‹object›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹MetaTransactionWallet›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹MetaTransactionWallet› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### signAndExecuteMetaTransaction

▸ **signAndExecuteMetaTransaction**\(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›\): _Promise‹CeloTransactionObject‹string››_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L112)

Execute a signed meta transaction Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput |

**Returns:** _Promise‹CeloTransactionObject‹string››_

### signMetaTransaction

▸ **signMetaTransaction**\(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›, `nonce?`: undefined \| number\): _Promise‹Signature›_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L93)

Signs a meta transaction as EIP712 typed data

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionWrapper |
| `nonce?` | undefined \| number | Optional -- will query contract state if not passed |

**Returns:** _Promise‹Signature›_

signature a Signature

### signer

▸ **signer**\(\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/MetaTransactionWallet.ts:193_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L193)

**Returns:** _Promise‹string›_

