# Class: OffchainError

## Hierarchy

* RootError‹[OffchainError](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md#offchainerror)›

  ↳ **OffchainError**

## Implements

* BaseError‹[OffchainError](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md#offchainerror)›
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

*Overrides void*

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

*Inherited from [OffchainError](_identity_offchain_schema_utils_.offchainerror.md).[errorType](_identity_offchain_schema_utils_.offchainerror.md#errortype)*

Defined in packages/base/lib/result.d.ts:25

___

###  message

• **message**: *string*

*Implementation of [IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md).[message](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md#message)*

*Inherited from [InvalidDataError](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md).[message](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md#message)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Implementation of [IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md).[name](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md#name)*

*Inherited from [InvalidDataError](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md).[name](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md#name)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Implementation of [IOffchainError](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md).[stack](../interfaces/_identity_offchain_schema_utils_.ioffchainerror.md#optional-stack)*

*Inherited from [InvalidDataError](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md).[stack](../interfaces/_identity_offchain_schema_utils_.invaliddataerror.md#optional-stack)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975
