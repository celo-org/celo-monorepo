# DowntimeSlasherWrapper

Contract handling slashing for Validator downtime

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹DowntimeSlasher›

  ↳ **DowntimeSlasherWrapper**

## Index

### Constructors

* [constructor](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#constructor)

### Properties

* [events](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#events)
* [isDown](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#isdown)
* [slashableDowntime](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashabledowntime)
* [slashingIncentives](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashingincentives)

### Accessors

* [address](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#address)

### Methods

* [getConfig](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getconfig)
* [getValidatorSignerIndex](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#getvalidatorsignerindex)
* [isValidatorDown](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#isvalidatordown)
* [slashEndSignerIndex](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashendsignerindex)
* [slashStartSignerIndex](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashstartsignerindex)
* [slashValidator](_wrappers_downtimeslasher_.downtimeslasherwrapper.md#slashvalidator)

## Constructors

### constructor

+ **new DowntimeSlasherWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: DowntimeSlasher\): [_DowntimeSlasherWrapper_](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | DowntimeSlasher |

**Returns:** [_DowntimeSlasherWrapper_](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)

## Properties

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### isDown

• **isDown**: _function_ = proxyCall\(this.contract.methods.isDown\)

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L69)

Tests if a validator has been down.

**`param`** First block of the downtime.

**`param`** Validator index at the first block.

**`param`** Validator index at the last block.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### slashableDowntime

• **slashableDowntime**: _function_ = proxyCall\(this.contract.methods.slashableDowntime, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L50)

Returns slashable downtime in blocks.

**`returns`** The number of consecutive blocks before a Validator missing from IBFT consensus can be slashed.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### slashingIncentives

• **slashingIncentives**: _function_ = proxyCall\(this.contract.methods.slashingIncentives, undefined, \(res\): { reward: BigNumber penalty: BigNumber } =&gt; \({ reward: valueToBigNumber\(res.reward\), penalty: valueToBigNumber\(res.penalty\), }\)\)

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L37)

Returns slashing incentives.

**`returns`** Rewards and penaltys for slashing.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_DowntimeSlasherConfig_](../interfaces/_wrappers_downtimeslasher_.downtimeslasherconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L55)

Returns current configuration parameters.

**Returns:** _Promise‹_[_DowntimeSlasherConfig_](../interfaces/_wrappers_downtimeslasher_.downtimeslasherconfig.md)_›_

### getValidatorSignerIndex

▸ **getValidatorSignerIndex**\(`validatorOrSignerAddress`: [Address](../external-modules/_base_.md#address), `blockNumber`: number\): _Promise‹number›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L92)

Determines the validator signer given an account or signer address and block number.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorOrSignerAddress` | [Address](../external-modules/_base_.md#address) | Address of the validator account or signer. |
| `blockNumber` | number | Block at which to determine the signer index. |

**Returns:** _Promise‹number›_

### isValidatorDown

▸ **isValidatorDown**\(`validatorOrSignerAddress`: [Address](../external-modules/_base_.md#address), `startBlock?`: undefined \| number, `endBlock?`: undefined \| number\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L77)

Tests if the given validator or signer has been down.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorOrSignerAddress` | [Address](../external-modules/_base_.md#address) | Address of the validator account or signer. |
| `startBlock?` | undefined \| number | First block of the downtime, undefined if using endBlock. |
| `endBlock?` | undefined \| number | Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided. |

**Returns:** _Promise‹boolean›_

### slashEndSignerIndex

▸ **slashEndSignerIndex**\(`endBlock`: number, `endSignerIndex`: number\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L157)

Slash a Validator for downtime.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `endBlock` | number | The last block of the downtime to slash for. |
| `endSignerIndex` | number | Validator index at the last block. |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### slashStartSignerIndex

▸ **slashStartSignerIndex**\(`startBlock`: number, `startSignerIndex`: number\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L133)

Slash a Validator for downtime.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `startBlock` | number | First block of the downtime. |
| `startSignerIndex` | number | Validator index at the first block. |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### slashValidator

▸ **slashValidator**\(`validatorOrSignerAddress`: [Address](../external-modules/_base_.md#address), `startBlock?`: undefined \| number, `endBlock?`: undefined \| number\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/DowntimeSlasher.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/DowntimeSlasher.ts#L116)

Slash a Validator for downtime.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorOrSignerAddress` | [Address](../external-modules/_base_.md#address) | - |
| `startBlock?` | undefined \| number | First block of the downtime, undefined if using endBlock. |
| `endBlock?` | undefined \| number | Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided. |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

