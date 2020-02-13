# External module: "utils/signing-utils"

## Index

### Functions

* [recoverTransaction](_utils_signing_utils_.md#recovertransaction)
* [signTransaction](_utils_signing_utils_.md#signtransaction)

## Functions

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[[CeloTx](../interfaces/_utils_tx_signing_.celotx.md), string]*

*Defined in [packages/contractkit/src/utils/signing-utils.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L131)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[[CeloTx](../interfaces/_utils_tx_signing_.celotx.md), string]*

___

###  signTransaction

▸ **signTransaction**(`txn`: any, `privateKey`: string): *Promise‹any›*

*Defined in [packages/contractkit/src/utils/signing-utils.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`txn` | any |
`privateKey` | string |

**Returns:** *Promise‹any›*
