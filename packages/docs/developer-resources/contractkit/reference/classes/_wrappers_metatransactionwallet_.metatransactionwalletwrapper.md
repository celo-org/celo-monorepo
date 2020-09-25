# Class: MetaTransactionWalletWrapper

Class that wraps the MetaTransactionWallet

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹MetaTransactionWallet›

  ↳ **MetaTransactionWalletWrapper**

## Index

### Constructors

* [constructor](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#constructor)

### Properties

* [_chainId](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#optional-_chainid)
* [_signer](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#optional-_signer)
* [eip712DomainSeparator](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#eip712domainseparator)
* [events](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#events)
* [getMetaTransactionDigest](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getmetatransactiondigest)
* [getMetaTransactionSigner](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getmetatransactionsigner)
* [isOwner](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#isowner)
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

###  constructor

\+ **new MetaTransactionWalletWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MetaTransactionWallet): *[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | MetaTransactionWallet |

**Returns:** *[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)*

## Properties

### `Optional` _chainId

• **_chainId**? : *undefined | number*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:209](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L209)*

Get an cache the chain ID -- assume it's static for a kit instance

**`returns`** chainId

___

### `Optional` _signer

• **_signer**? : *[Address](../modules/_base_.md#address)*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:221](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L221)*

Get an cache the signer - it should be static for a Wallet instance

**`returns`** signer

___

###  eip712DomainSeparator

• **eip712DomainSeparator**: *function* = proxyCall(this.contract.methods.eip712DomainSeparator)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L185)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getMetaTransactionDigest

• **getMetaTransactionDigest**: *function* = proxyCall(
    this.contract.methods.getMetaTransactionDigest,
    this.getMetaTransactionDigestParams,
    stringIdentity
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L155)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getMetaTransactionSigner

• **getMetaTransactionSigner**: *function* = proxyCall(
    this.contract.methods.getMetaTransactionSigner,
    this.getMetaTransactionSignerParams,
    stringIdentity
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L179)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isOwner

• **isOwner**: *function* = proxyCall(this.contract.methods.isOwner)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:186](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L186)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  nonce

• **nonce**: *function* = proxyCall(this.contract.methods.nonce, undefined, valueToInt)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L187)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setEip712DomainSeparator

• **setEip712DomainSeparator**: *function* = proxySend(
    this.kit,
    this.contract.methods.setEip712DomainSeparator
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:200](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L200)*

#### Type declaration:

▸ (): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  setSigner

• **setSigner**: *function* = proxySend(
    this.kit,
    this.contract.methods.setSigner
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:195](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L195)*

#### Type declaration:

▸ (`newSigner`: [Address](../modules/_base_.md#address)): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`newSigner` | [Address](../modules/_base_.md#address) |

___

###  transferOwnership

• **transferOwnership**: *function* = proxySend(
    this.kit,
    this.contract.methods.transferOwnership
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L190)*

#### Type declaration:

▸ (`newOwner`: [Address](../modules/_base_.md#address)): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`newOwner` | [Address](../modules/_base_.md#address) |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  executeMetaTransaction

▸ **executeMetaTransaction**(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›, `signature`: Signature): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L75)*

Execute a signed meta transaction
Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› |
`signature` | Signature |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  executeTransaction

▸ **executeTransaction**(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L38)*

Execute a transaction originating from the MTW
Reverts if the caller is not a signer

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a MTWTransaction  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  executeTransactions

▸ **executeTransactions**(`txs`: Array‹[TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any››): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L57)*

Execute a batch of transactions originating from the MTW
Reverts if the caller is not a signer

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txs` | Array‹[TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›› | An array of MTWTransactions  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  signAndExecuteMetaTransaction

▸ **signAndExecuteMetaTransaction**(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L138)*

Execute a signed meta transaction
Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string››*

___

###  signMetaTransaction

▸ **signMetaTransaction**(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›, `nonce?`: undefined | number): *Promise‹Signature›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L101)*

Signs a meta transaction as EIP712 typed data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionWrapper |
`nonce?` | undefined &#124; number | Optional -- will query contract state if not passed |

**Returns:** *Promise‹Signature›*

signature a Signature

___

###  signer

▸ **signer**(): *Promise‹string›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:222](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L222)*

**Returns:** *Promise‹string›*
