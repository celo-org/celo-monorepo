[@celo/encrypted-backup](../README.md) › ["odis"](_odis_.md)

# Module: "odis"

## Index

### Functions

* [buildOdisDomain](_odis_.md#buildodisdomain)
* [odisHardenKey](_odis_.md#odishardenkey)
* [odisQueryAuthorizer](_odis_.md#odisqueryauthorizer)

## Functions

###  buildOdisDomain

▸ **buildOdisDomain**(`config`: [OdisHardeningConfig](../interfaces/_config_.odishardeningconfig.md), `authorizer`: Address, `salt?`: undefined | string): *SequentialDelayDomain*

*Defined in [packages/sdk/encrypted-backup/src/odis.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.ts#L50)*

Builds an ODIS SequentialDelayDomain with the given hardening configuration.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`config` | [OdisHardeningConfig](../interfaces/_config_.odishardeningconfig.md) | - |
`authorizer` | Address | Address of the key that should authorize requests to ODIS. |
`salt?` | undefined &#124; string | - |

**Returns:** *SequentialDelayDomain*

A SequentialDelayDomain with the provided rate limiting configuration.

___

###  odisHardenKey

▸ **odisHardenKey**(`key`: Buffer, `domain`: SequentialDelayDomain, `environment`: OdisServiceContext, `wallet?`: [EIP712Wallet](_utils_.md#eip712wallet)): *Promise‹Result‹Buffer, [BackupError](_errors_.md#backuperror)››*

*Defined in [packages/sdk/encrypted-backup/src/odis.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.ts#L74)*

Returns a hardened key derived from the input key material and a POPRF evaluation on that keying
material under the given rate limiting domain.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`key` | Buffer | Input key material which will be the blinded input to the ODIS POPRF. |
`domain` | SequentialDelayDomain | Rate limiting configuration and domain input to the ODIS POPRF. |
`environment` | OdisServiceContext | Information for the targeted ODIS environment. |
`wallet?` | [EIP712Wallet](_utils_.md#eip712wallet) | Wallet with access to the authorizer signing key specified in the domain input.        Should be provided if the input domain is authenticated.  |

**Returns:** *Promise‹Result‹Buffer, [BackupError](_errors_.md#backuperror)››*

___

###  odisQueryAuthorizer

▸ **odisQueryAuthorizer**(`nonce`: Buffer): *object*

*Defined in [packages/sdk/encrypted-backup/src/odis.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.ts#L158)*

Derive from the nonce a private key and use it to instantiate a wallet for request signing

**`remarks`** It is important that the auth key does not mix in entropy from the password value. If
it did, then the derived address and signatures would act as a commitment to the underlying
password value and would allow offline brute force attacks when combined with the other values
mixed into the key value.

**Parameters:**

Name | Type |
------ | ------ |
`nonce` | Buffer |

**Returns:** *object*

* **address**: *Address*

* **wallet**: *[EIP712Wallet](_utils_.md#eip712wallet)*
