# External module: "contractkit/src/utils/phone-number-lookup/matchmaking"

## Index

### Functions

* [getContactMatches](_contractkit_src_utils_phone_number_lookup_matchmaking_.md#getcontactmatches)
* [obfuscateNumberForMatchmaking](_contractkit_src_utils_phone_number_lookup_matchmaking_.md#obfuscatenumberformatchmaking)

## Functions

###  getContactMatches

▸ **getContactMatches**(`e164NumberCaller`: E164Number, `e164NumberContacts`: E164Number[], `account`: string, `phoneNumberIdentifier`: string, `signer`: [AuthSigner](_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.md#authsigner), `context`: [ServiceContext](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.servicecontext.md), `clientVersion?`: undefined | string): *Promise‹E164Number[]›*

*Defined in [contractkit/src/utils/phone-number-lookup/matchmaking.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/matchmaking.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`e164NumberCaller` | E164Number |
`e164NumberContacts` | E164Number[] |
`account` | string |
`phoneNumberIdentifier` | string |
`signer` | [AuthSigner](_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.servicecontext.md) |
`clientVersion?` | undefined &#124; string |

**Returns:** *Promise‹E164Number[]›*

___

###  obfuscateNumberForMatchmaking

▸ **obfuscateNumberForMatchmaking**(`e164Number`: string): *string*

*Defined in [contractkit/src/utils/phone-number-lookup/matchmaking.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/matchmaking.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |

**Returns:** *string*
