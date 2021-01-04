# Module: "odis/matchmaking"

## Index

### Functions

* [getContactMatches](_odis_matchmaking_.md#getcontactmatches)
* [obfuscateNumberForMatchmaking](_odis_matchmaking_.md#obfuscatenumberformatchmaking)

## Functions

###  getContactMatches

▸ **getContactMatches**(`e164NumberCaller`: E164Number, `e164NumberContacts`: E164Number[], `account`: string, `phoneNumberIdentifier`: string, `signer`: [AuthSigner](_odis_query_.md#authsigner), `context`: [ServiceContext](../interfaces/_odis_query_.servicecontext.md), `clientVersion?`: undefined | string, `sessionID?`: undefined | string): *Promise‹E164Number[]›*

*Defined in [packages/sdk/identity/src/odis/matchmaking.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/matchmaking.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`e164NumberCaller` | E164Number |
`e164NumberContacts` | E164Number[] |
`account` | string |
`phoneNumberIdentifier` | string |
`signer` | [AuthSigner](_odis_query_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_odis_query_.servicecontext.md) |
`clientVersion?` | undefined &#124; string |
`sessionID?` | undefined &#124; string |

**Returns:** *Promise‹E164Number[]›*

___

###  obfuscateNumberForMatchmaking

▸ **obfuscateNumberForMatchmaking**(`e164Number`: string): *string*

*Defined in [packages/sdk/identity/src/odis/matchmaking.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/matchmaking.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |

**Returns:** *string*
