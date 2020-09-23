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
* [contract](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#contract)
* [eip712DomainSeparator](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#eip712domainseparator)
* [events](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#events)
* [getMetaTransactionDigest](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getmetatransactiondigest)
* [getMetaTransactionSigner](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getmetatransactionsigner)
* [getMetaTransactionStructHash](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getmetatransactionstructhash)
* [isOwner](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#isowner)
* [nonce](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#nonce)
* [setEip712DomainSeparator](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#seteip712domainseparator)
* [setSigner](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#setsigner)
* [signer](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#signer)
* [transferOwnership](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#transferownership)

### Accessors

* [address](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#address)

### Methods

* [_getChainId](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#_getchainid)
* [_spreadMetaTx](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#_spreadmetatx)
* [_spreadSignedMetaTx](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#_spreadsignedmetatx)
* [buildExecuteTransactionsTx](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#buildexecutetransactionstx)
* [buildExecuteTransactionsWrapperTx](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#buildexecutetransactionswrappertx)
* [executeMetaTransaction](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#executemetatransaction)
* [executeTransaction](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#executetransaction)
* [executeTransactions](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#executetransactions)
* [getMetaTransactionTypedData](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getmetatransactiontypeddata)
* [getPastEvents](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#getpastevents)
* [signMetaTransaction](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#signmetatransaction)

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

• **_chainId**? : *undefined | number* = undefined

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:234](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L234)*

Get an cache the chain ID -- assume it's static for a kit instance

**`returns`** chainId

___

###  contract

• **contract**: *MetaTransactionWallet*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[contract](_wrappers_basewrapper_.basewrapper.md#contract)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L20)*

___

###  eip712DomainSeparator

• **eip712DomainSeparator**: *function* = proxyCall(this.contract.methods.eip712DomainSeparator)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L210)*

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
    this._spreadMetaTx,
    stringIdentity
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:192](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L192)*

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
    this._spreadSignedMetaTx,
    stringIdentity
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:204](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L204)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getMetaTransactionStructHash

• **getMetaTransactionStructHash**: *function* = proxyCall(
    this.contract.methods.getMetaTransactionStructHash,
    this._spreadMetaTx,
    stringIdentity
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L198)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isOwner

• **isOwner**: *function* = proxyCall(this.contract.methods.isOwner)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L211)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  nonce

• **nonce**: *function* = proxyCall(this.contract.methods.nonce, undefined, valueToInt)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:212](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L212)*

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

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:225](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L225)*

#### Type declaration:

▸ (): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  setSigner

• **setSigner**: *function* = proxySend(
    this.kit,
    this.contract.methods.setSigner
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:220](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L220)*

#### Type declaration:

▸ (`newSigner`: [Address](../modules/_base_.md#address)): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`newSigner` | [Address](../modules/_base_.md#address) |

___

###  signer

• **signer**: *function* = proxyCall(this.contract.methods.signer, undefined, stringIdentity)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L213)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transferOwnership

• **transferOwnership**: *function* = proxySend(
    this.kit,
    this.contract.methods.transferOwnership
  )

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L215)*

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

###  _getChainId

▸ **_getChainId**(): *Promise‹number›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L235)*

**Returns:** *Promise‹number›*

___

###  _spreadMetaTx

▸ **_spreadMetaTx**(`mtx`: [MTWMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwmetatransaction.md)): *[string, string, string, number]*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L173)*

**Parameters:**

Name | Type |
------ | ------ |
`mtx` | [MTWMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwmetatransaction.md) |

**Returns:** *[string, string, string, number]*

___

###  _spreadSignedMetaTx

▸ **_spreadSignedMetaTx**(`mtx`: [MTWSignedMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwsignedmetatransaction.md)): *[string, string, string, number, number, string, string]*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:180](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L180)*

**Parameters:**

Name | Type |
------ | ------ |
`mtx` | [MTWSignedMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwsignedmetatransaction.md) |

**Returns:** *[string, string, string, number, number, string, string]*

___

###  buildExecuteTransactionsTx

▸ **buildExecuteTransactionsTx**(`txs`: [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)[]): *TransactionObject‹void›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L69)*

Builds the TransactionObject for executeTransactions
Reverts if the caller is not a signer

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txs` | [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)[] | An array of MTWTransactions  |

**Returns:** *TransactionObject‹void›*

___

###  buildExecuteTransactionsWrapperTx

▸ **buildExecuteTransactionsWrapperTx**(`txs`: [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)[]): *[MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L89)*

Builds a MetaTransaction that wraps a series of Transactions
Reverts if the caller is not a signer

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txs` | [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)[] | An array of MTWTransactions |

**Returns:** *[MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)*

MTWMetaTransaction

___

###  executeMetaTransaction

▸ **executeMetaTransaction**(`mtx`: [MTWSignedMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwsignedmetatransaction.md)): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L104)*

Execute a signed meta transaction
Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`mtx` | [MTWSignedMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwsignedmetatransaction.md) | a MTWSignedMetaTransaction  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  executeTransaction

▸ **executeTransaction**(`tx`: [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L44)*

Execute a transaction originating from the MTW
Reverts if the caller is not a signer

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md) | a MTWTransaction  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹string›*

___

###  executeTransactions

▸ **executeTransactions**(`txs`: [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)[]): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L60)*

Execute a batch of transactions originating from the MTW
Reverts if the caller is not a signer

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txs` | [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)[] | An array of MTWTransactions  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  getMetaTransactionTypedData

▸ **getMetaTransactionTypedData**(`mtx`: [MTWMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwmetatransaction.md)): *Promise‹EIP712TypedData›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:169](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L169)*

Get MetaTransaction Typed Data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`mtx` | [MTWMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwmetatransaction.md) | MTWMetaTransaction |

**Returns:** *Promise‹EIP712TypedData›*

EIP712TypedData

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

###  signMetaTransaction

▸ **signMetaTransaction**(`signer`: [Address](../modules/_base_.md#address), `tx`: [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md), `nonce?`: undefined | number): *Promise‹[MTWSignedMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwsignedmetatransaction.md)›*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L123)*

Signs a meta transaction as EIP712 typed data

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_base_.md#address) |
`tx` | [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md) |
`nonce?` | undefined &#124; number |

**Returns:** *Promise‹[MTWSignedMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwsignedmetatransaction.md)›*

smtx a MTWSignedMetaTransaction
