[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/MetaTransactionWallet"](../modules/_wrappers_metatransactionwallet_.md) › [MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

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
* [version](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md#version)

## Constructors

###  constructor

\+ **new MetaTransactionWalletWrapper**(`connection`: Connection, `contract`: MetaTransactionWallet): *[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | MetaTransactionWallet |

**Returns:** *[MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)*

## Properties

### `Optional` _chainId

• **_chainId**? : *undefined | number*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L179)*

Get and cache the chain ID -- assume it's static for a kit instance

**`returns`** chainId

___

### `Optional` _signer

• **_signer**? : *Address*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:192](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L192)*

Get an cache the signer - it should be static for a Wallet instance

**`returns`** signer

___

###  eip712DomainSeparator

• **eip712DomainSeparator**: *function* = proxyCall(this.contract.methods.eip712DomainSeparator)

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L155)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *MetaTransactionWallet["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  getMetaTransactionDigest

• **getMetaTransactionDigest**: *function* = proxyCall(
    this.contract.methods.getMetaTransactionDigest,
    this.getMetaTransactionDigestParams,
    stringIdentity
  )

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L127)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L149)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isOwner

• **isOwner**: *function* = proxyCall(this.contract.methods.isOwner)

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L156)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

___

###  nonce

• **nonce**: *function* = proxyCall(this.contract.methods.nonce, undefined, valueToInt)

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L157)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setEip712DomainSeparator

• **setEip712DomainSeparator**: *function* = proxySend(
    this.connection,
    this.contract.methods.setEip712DomainSeparator
  )

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L170)*

#### Type declaration:

▸ (): *CeloTransactionObject‹void›*

___

###  setSigner

• **setSigner**: *function* = proxySend(
    this.connection,
    this.contract.methods.setSigner
  )

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L165)*

#### Type declaration:

▸ (`newSigner`: Address): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`newSigner` | Address |

___

###  transferOwnership

• **transferOwnership**: *function* = proxySend(
    this.connection,
    this.contract.methods.transferOwnership
  )

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L160)*

#### Type declaration:

▸ (`newOwner`: Address): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`newOwner` | Address |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  executeMetaTransaction

▸ **executeMetaTransaction**(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›, `signature`: Signature): *CeloTransactionObject‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L68)*

Execute a signed meta transaction
Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput |
`signature` | Signature | a Signature  |

**Returns:** *CeloTransactionObject‹string›*

___

###  executeTransaction

▸ **executeTransaction**(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›): *CeloTransactionObject‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L38)*

Execute a transaction originating from the MTW
Reverts if the caller is not a signer

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput  |

**Returns:** *CeloTransactionObject‹string›*

___

###  executeTransactions

▸ **executeTransactions**(`txs`: Array‹[TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any››): *CeloTransactionObject‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L51)*

Execute a batch of transactions originating from the MTW
Reverts if the caller is not a signer

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txs` | Array‹[TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›› | An array of TransactionInput  |

**Returns:** *CeloTransactionObject‹object›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹MetaTransactionWallet›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹MetaTransactionWallet› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  signAndExecuteMetaTransaction

▸ **signAndExecuteMetaTransaction**(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›): *Promise‹CeloTransactionObject‹string››*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L112)*

Execute a signed meta transaction
Reverts if meta-tx signer is not a signer for the wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any› | a TransactionInput  |

**Returns:** *Promise‹CeloTransactionObject‹string››*

___

###  signMetaTransaction

▸ **signMetaTransaction**(`tx`: [TransactionInput](../modules/_wrappers_metatransactionwallet_.md#transactioninput)‹any›, `nonce?`: undefined | number): *Promise‹Signature›*

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L93)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts:193](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/MetaTransactionWallet.ts#L193)*

**Returns:** *Promise‹string›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
