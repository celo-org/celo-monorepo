# Class: RootError <**T**>

## Type parameters

▪ **T**

## Hierarchy

* [Error](_identity_task_.rooterror.md#static-error)

  ↳ **RootError**

  ↳ [OffchainError](_identity_offchain_schema_utils_.offchainerror.md)

## Implements

* [BaseError](../interfaces/_identity_task_.baseerror.md)‹T›

## Index

### Constructors

* [constructor](_identity_task_.rooterror.md#constructor)

### Properties

* [errorType](_identity_task_.rooterror.md#errortype)
* [message](_identity_task_.rooterror.md#message)
* [name](_identity_task_.rooterror.md#name)
* [stack](_identity_task_.rooterror.md#optional-stack)
* [Error](_identity_task_.rooterror.md#static-error)

## Constructors

###  constructor

\+ **new RootError**(`errorType`: T): *[RootError](_identity_task_.rooterror.md)*

*Defined in [packages/contractkit/src/identity/task.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/task.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`errorType` | T |

**Returns:** *[RootError](_identity_task_.rooterror.md)*

## Properties

###  errorType

• **errorType**: *T*

*Implementation of [BaseError](../interfaces/_identity_task_.baseerror.md).[errorType](../interfaces/_identity_task_.baseerror.md#errortype)*

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

___

### `Static` Error

▪ **Error**: *ErrorConstructor*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:984
