# External module: "utils/signing-utils"

## Index

### Functions

* [recoverTransaction](_utils_signing_utils_.md#recovertransaction)
* [signTransaction](_utils_signing_utils_.md#signtransaction)

## Functions

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[Tx, string]*

*Defined in [contractkit/src/utils/signing-utils.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L140)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[Tx, string]*

___

###  signTransaction

▸ **signTransaction**(`txn`: any, `privateKey`: string): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/utils/signing-utils.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`txn` | any |
`privateKey` | string |

**Returns:** *Promise‹EncodedTransaction›*
