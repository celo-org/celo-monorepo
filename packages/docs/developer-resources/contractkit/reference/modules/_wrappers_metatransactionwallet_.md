# External module: "wrappers/MetaTransactionWallet"

## Index

### Classes

* [MetaTransactionWalletWrapper](../classes/_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

### Interfaces

* [MTWMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwmetatransaction.md)
* [MTWSignedMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwsignedmetatransaction.md)
* [MTWTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwtransaction.md)

### Functions

* [buildMetaTxTypedData](_wrappers_metatransactionwallet_.md#const-buildmetatxtypeddata)

## Functions

### `Const` buildMetaTxTypedData

▸ **buildMetaTxTypedData**(`walletAddress`: [Address](_base_.md#address), `tx`: [MTWMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwmetatransaction.md), `chainId`: number): *EIP712TypedData*

*Defined in [packages/contractkit/src/wrappers/MetaTransactionWallet.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/MetaTransactionWallet.ts#L243)*

**Parameters:**

Name | Type |
------ | ------ |
`walletAddress` | [Address](_base_.md#address) |
`tx` | [MTWMetaTransaction](../interfaces/_wrappers_metatransactionwallet_.mtwmetatransaction.md) |
`chainId` | number |

**Returns:** *EIP712TypedData*
