# JSONParseError

## Hierarchy

↳ [RootError]()‹string›

↳ **JSONParseError**

## Implements

* [BaseError]()‹string›

## Index

### Constructors

* [constructor]()

### Properties

* [error]()
* [errorType]()
* [message]()
* [name]()
* [stack]()

## Constructors

### constructor

+ **new JSONParseError**\(`error`: [Error]()\): [_JSONParseError_]()

_Overrides_ [_RootError_]()_._[_constructor_]()

_Defined in_ [_packages/sdk/base/src/result.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L79)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `error` | [Error]() |

**Returns:** [_JSONParseError_]()

## Properties

### `Readonly` error

• **error**: [_Error_]()

_Defined in_ [_packages/sdk/base/src/result.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L80)

### `Readonly` errorType

• **errorType**: _string_

_Implementation of_ [_BaseError_]()_._[_errorType_]()

_Inherited from_ [_RootError_]()_._[_errorType_]()

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

