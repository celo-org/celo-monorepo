# ber-utils

## Index

### Functions

* [asn1FromPublicKey](_ber_utils_.md#asn1frompublickey)
* [parseBERSignature](_ber_utils_.md#parsebersignature)
* [publicKeyFromAsn1](_ber_utils_.md#publickeyfromasn1)
* [toArrayBuffer](_ber_utils_.md#const-toarraybuffer)

## Functions

### asn1FromPublicKey

▸ **asn1FromPublicKey**\(`bn`: BigNumber\): _Buffer_

_Defined in_ [_ber-utils.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/ber-utils.ts#L23)

This is used only for mocking Creates an asn1 key to emulate KMS response

**Parameters:**

| Name | Type |
| :--- | :--- |
| `bn` | BigNumber |

**Returns:** _Buffer_

### parseBERSignature

▸ **parseBERSignature**\(`b`: Buffer\): _object_

_Defined in_ [_ber-utils.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/ber-utils.ts#L44)

AWS returns DER encoded signatures but DER is valid BER

**Parameters:**

| Name | Type |
| :--- | :--- |
| `b` | Buffer |

**Returns:** _object_

* **r**: _Buffer_
* **s**: _Buffer_

### publicKeyFromAsn1

▸ **publicKeyFromAsn1**\(`b`: Buffer\): _BigNumber_

_Defined in_ [_ber-utils.ts:9_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/ber-utils.ts#L9)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `b` | Buffer |

**Returns:** _BigNumber_

### `Const` toArrayBuffer

▸ **toArrayBuffer**\(`b`: Buffer\): _ArrayBuffer_

_Defined in_ [_ber-utils.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/ber-utils.ts#L5)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `b` | Buffer |

**Returns:** _ArrayBuffer_

