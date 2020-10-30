# Class: MetaTransactionWalletDeployerWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹MetaTransactionWalletDeployer›

  ↳ **MetaTransactionWalletDeployerWrapper**

## Index

### Constructors

* [constructor](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#constructor)

### Properties

* [canDeploy](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#candeploy)
* [changeDeployerPermission](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#changedeployerpermission)
* [deploy](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#deploy)
* [events](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#events)
* [getWallet](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#getwallet)
* [owner](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#owner)

### Accessors

* [address](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#address)

### Methods

* [getPastEvents](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md#getpastevents)

## Constructors

###  constructor

\+ **new MetaTransactionWalletDeployerWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: MetaTransactionWalletDeployer): *[MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | MetaTransactionWalletDeployer |

**Returns:** *[MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)*

## Properties

###  canDeploy

• **canDeploy**: *function* = proxyCall(this.contract.methods.canDeploy, undefined, identity)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts#L8)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  changeDeployerPermission

• **changeDeployerPermission**: *function* = proxySend(this.kit, this.contract.methods.changeDeployerPermission)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts#L11)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  deploy

• **deploy**: *function* = proxySend(this.kit, this.contract.methods.deploy)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts#L12)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

###  getWallet

• **getWallet**: *function* = proxyCall(this.contract.methods.wallets, undefined, stringIdentity)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts#L7)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  owner

• **owner**: *function* = proxyCall(this.contract.methods.owner, undefined, stringIdentity)

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWalletDeployer.ts#L9)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

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
