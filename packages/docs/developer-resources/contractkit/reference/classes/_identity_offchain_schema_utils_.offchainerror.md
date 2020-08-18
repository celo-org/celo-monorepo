# Class: OffchainError

## Hierarchy

  ↳ [RootError](_identity_task_.rooterror.md)‹[OffchainError](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md#offchainerror)›

  ↳ **OffchainError**

## Implements

* [BaseError](../interfaces/_identity_task_.baseerror.md)‹[OffchainError](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md#offchainerror)›
* [IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md)

## Index

### Constructors

* [constructor](_identity_offchain_schema_utils_.offchainerror.md#constructor)

### Properties

* [error](_identity_offchain_schema_utils_.offchainerror.md#error)
* [errorType](_identity_offchain_schema_utils_.offchainerror.md#errortype)
* [message](_identity_offchain_schema_utils_.offchainerror.md#message)
* [name](_identity_offchain_schema_utils_.offchainerror.md#name)
* [stack](_identity_offchain_schema_utils_.offchainerror.md#optional-stack)

## Constructors

###  constructor

\+ **new OffchainError**(`error`: [OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors)): *[OffchainError](_identity_offchain_schema_utils_.offchainerror.md)*

*Overrides [RootError](_identity_task_.rooterror.md).[constructor](_identity_task_.rooterror.md#constructor)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors) |

**Returns:** *[OffchainError](_identity_offchain_schema_utils_.offchainerror.md)*

## Properties

###  error

• **error**: *[OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors)*

*Implementation of [IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md).[error](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md#error)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L22)*

___

###  errorType

• **errorType**: *[OffchainError](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md#offchainerror)*

*Implementation of [IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md).[errorType](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md#errortype)*

*Inherited from [RootError](_identity_task_.rooterror.md).[errorType](_identity_task_.rooterror.md#errortype)*

*Defined in [packages/contractkit/src/identity/task.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/task.ts#L34)*

___

###  message

• **message**: *string*

*Inherited from [RootError](_identity_task_.rooterror.md).[message](_identity_task_.rooterror.md#message)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from [RootError](_identity_task_.rooterror.md).[name](_identity_task_.rooterror.md#name)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [RootError](_identity_task_.rooterror.md).[stack](_identity_task_.rooterror.md#optional-stack)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975
