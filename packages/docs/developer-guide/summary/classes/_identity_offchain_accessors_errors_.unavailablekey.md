# UnavailableKey

## Hierarchy

* RootError‹[UnavailableKey](../enums/_identity_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)›

  ↳ **UnavailableKey**

## Implements

* BaseError‹[UnavailableKey](../enums/_identity_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_errors_.unavailablekey.md#constructor)

### Properties

* [account](_identity_offchain_accessors_errors_.unavailablekey.md#readonly-account)
* [errorType](_identity_offchain_accessors_errors_.unavailablekey.md#readonly-errortype)
* [message](_identity_offchain_accessors_errors_.unavailablekey.md#message)
* [name](_identity_offchain_accessors_errors_.unavailablekey.md#name)
* [stack](_identity_offchain_accessors_errors_.unavailablekey.md#optional-stack)

## Constructors

### constructor

+ **new UnavailableKey**\(`account`: [Address](../modules/_base_.md#address)\): [_UnavailableKey_](_identity_offchain_accessors_errors_.unavailablekey.md)

_Overrides void_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/errors.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/errors.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](../modules/_base_.md#address) |

**Returns:** [_UnavailableKey_](_identity_offchain_accessors_errors_.unavailablekey.md)

## Properties

### `Readonly` account

• **account**: [_Address_](../modules/_base_.md#address)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/errors.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/errors.ts#L32)

### `Readonly` errorType

• **errorType**: [_UnavailableKey_](../enums/_identity_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)

_Inherited from_ [_InvalidDataError_](_identity_offchain_accessors_errors_.invaliddataerror.md)_._[_errorType_](_identity_offchain_accessors_errors_.invaliddataerror.md#readonly-errortype)

Defined in packages/base/lib/result.d.ts:19

### message

• **message**: _string_

_Inherited from_ [_InvalidDataError_](_identity_offchain_accessors_errors_.invaliddataerror.md)_._[_message_](_identity_offchain_accessors_errors_.invaliddataerror.md#message)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:974

### name

• **name**: _string_

_Inherited from_ [_InvalidDataError_](_identity_offchain_accessors_errors_.invaliddataerror.md)_._[_name_](_identity_offchain_accessors_errors_.invaliddataerror.md#name)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:973

### `Optional` stack

• **stack**? : _undefined \| string_

_Inherited from_ [_InvalidDataError_](_identity_offchain_accessors_errors_.invaliddataerror.md)_._[_stack_](_identity_offchain_accessors_errors_.invaliddataerror.md#optional-stack)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:975

