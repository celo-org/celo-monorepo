# Class: UnavailableKey

## Hierarchy

* RootError‹[UnavailableKey](../enums/_contractkit_src_identity_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)›

  ↳ **UnavailableKey**

## Implements

* BaseError‹[UnavailableKey](../enums/_contractkit_src_identity_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)›

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md#constructor)

### Properties

* [account](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md#account)
* [errorType](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md#errortype)
* [message](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md#message)
* [name](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md#name)
* [stack](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md#optional-stack)

## Constructors

###  constructor

\+ **new UnavailableKey**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *[UnavailableKey](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md)*

*Overrides void*

*Defined in [packages/contractkit/src/identity/offchain/accessors/errors.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/errors.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *[UnavailableKey](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md)*

## Properties

###  account

• **account**: *[Address](../modules/_contractkit_src_base_.md#address)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/errors.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/errors.ts#L32)*

___

###  errorType

• **errorType**: *[UnavailableKey](../enums/_contractkit_src_identity_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)*

*Inherited from [InvalidDataError](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md).[errorType](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md#errortype)*

Defined in packages/base/lib/result.d.ts:19

___

###  message

• **message**: *string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[message](_base_src_result_.rooterror.md#message)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[name](_base_src_result_.rooterror.md#name)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[stack](_base_src_result_.rooterror.md#optional-stack)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975
