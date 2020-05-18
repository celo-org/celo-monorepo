# BaseWrapper

Base ContractWrapper

## Type parameters

▪ **T**: _Contract_

## Hierarchy

* **BaseWrapper**

  ↳ [AccountsWrapper]()

  ↳ [AttestationsWrapper]()

  ↳ [BlockchainParametersWrapper]()

  ↳ [DoubleSigningSlasherWrapper]()

  ↳ [ValidatorsWrapper]()

  ↳ [DowntimeSlasherWrapper]()

  ↳ [ElectionWrapper]()

  ↳ [EscrowWrapper]()

  ↳ [ExchangeWrapper]()

  ↳ [FreezerWrapper]()

  ↳ [GasPriceMinimumWrapper]()

  ↳ [GoldTokenWrapper]()

  ↳ [GovernanceWrapper]()

  ↳ [LockedGoldWrapper]()

  ↳ [MultiSigWrapper]()

  ↳ [ReserveWrapper]()

  ↳ [SortedOraclesWrapper]()

  ↳ [StableTokenWrapper]()

  ↳ [ReleaseGoldWrapper]()

## Index

### Constructors

* [constructor]()

### Properties

* [events]()

### Accessors

* [address]()

## Constructors

### constructor

+ **new BaseWrapper**\(`kit`: [ContractKit](), `contract`: T\): [_BaseWrapper_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | T |

**Returns:** [_BaseWrapper_]()

## Properties

### events

• **events**: _any_ = this.contract.events

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

## Accessors

### address

• **get address**\(\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

