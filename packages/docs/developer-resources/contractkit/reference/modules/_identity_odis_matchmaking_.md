# External module: "identity/odis/matchmaking"

## Index

### Functions

* [getContactMatches](_identity_odis_matchmaking_.md#getcontactmatches)
* [obfuscateNumberForMatchmaking](_identity_odis_matchmaking_.md#obfuscatenumberformatchmaking)

## Functions

###  getContactMatches

▸ **getContactMatches**(`e164NumberCaller`: E164Number, `e164NumberContacts`: E164Number[], `account`: string, `phoneNumberIdentifier`: string, `signer`: [AuthSigner](_identity_odis_query_.md#authsigner), `context`: [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md), `clientVersion?`: undefined | string): *Promise‹E164Number[]›*

*Defined in [packages/contractkit/src/identity/odis/matchmaking.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/matchmaking.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`e164NumberCaller` | E164Number |
`e164NumberContacts` | E164Number[] |
`account` | string |
`phoneNumberIdentifier` | string |
`signer` | [AuthSigner](_identity_odis_query_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md) |
`clientVersion?` | undefined &#124; string |

**Returns:** *Promise‹E164Number[]›*

___

###  obfuscateNumberForMatchmaking

▸ **obfuscateNumberForMatchmaking**(`e164Number`: string): *string*

*Defined in [packages/contractkit/src/identity/odis/matchmaking.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/matchmaking.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |

**Returns:** *string*
