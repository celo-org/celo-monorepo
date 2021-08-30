# RootError

## Type parameters

▪ **T**

## Hierarchy

* [Error]()

  ↳ **RootError**

  ↳ [JSONParseError]()

## Implements

* [BaseError]()‹T›

## Index

### Constructors

* [constructor]()

### Properties

* [errorType]()
* [message]()
* [name]()
* [stack]()
* [Error]()

## Constructors

### constructor

+ **new RootError**\(`errorType`: T\): [_RootError_]()

_Defined in_ [_packages/sdk/base/src/result.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L66)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `errorType` | T |

**Returns:** [_RootError_]()

## Properties

### `Readonly` errorType

• **errorType**: _T_

_Implementation of_ [_BaseError_]()_._[_errorType_]()

_Defined in_ [_packages/sdk/base/src/result.ts:67_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L67)

### message

• **message**: _string_

_Inherited from_ [_RootError_]()_._[_message_]()

Defined in node\_modules/typescript/lib/lib.es5.d.ts:974

### name

• **name**: _string_

_Inherited from_ [_RootError_]()_._[_name_]()

Defined in node\_modules/typescript/lib/lib.es5.d.ts:973

### `Optional` stack

• **stack**? : _undefined \| string_

_Inherited from_ [_RootError_]()_._[_stack_]()

Defined in node\_modules/typescript/lib/lib.es5.d.ts:975

### `Static` Error

▪ **Error**: _ErrorConstructor_

Defined in node\_modules/typescript/lib/lib.es5.d.ts:984

