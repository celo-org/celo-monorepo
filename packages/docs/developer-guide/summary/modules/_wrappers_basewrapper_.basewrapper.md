# BaseWrapper

Base ContractWrapper

## Type parameters

▪ **T**: _Contract_

## Hierarchy

* **BaseWrapper**

  ↳ [AccountsWrapper]()

  ↳ [ValidatorsWrapper]()

  ↳ [AttestationsWrapper]()

  ↳ [BlockchainParametersWrapper]()

  ↳ [BaseSlasher]()

  ↳ [ElectionWrapper]()

  ↳ [EscrowWrapper]()

  ↳ [ExchangeWrapper]()

  ↳ [FreezerWrapper]()

  ↳ [GasPriceMinimumWrapper]()

  ↳ [GoldTokenWrapper]()

  ↳ [GovernanceWrapper]()

  ↳ [LockedGoldWrapper]()

  ↳ [MetaTransactionWalletWrapper]()

  ↳ [MetaTransactionWalletDeployerWrapper]()

  ↳ [MultiSigWrapper]()

  ↳ [ReserveWrapper]()

  ↳ [SortedOraclesWrapper]()

  ↳ [StableTokenWrapper]()

  ↳ [ReleaseGoldWrapper]()

## Index

### Constructors

* [constructor]()

### Properties

* [eventTypes]()
* [events]()
* [methodIds]()

### Accessors

* [address]()

### Methods

* [getPastEvents]()

## Constructors

### constructor

+ **new BaseWrapper**\(`kit`: [ContractKit](), `contract`: T\): [_BaseWrapper_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | T |

**Returns:** [_BaseWrapper_]()

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _T\["events"\]_ = this.contract.events

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

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

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

## Accessors

### address

• **get address**\(\): _string_

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹T›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹T› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

