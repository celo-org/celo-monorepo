[@celo/encrypted-backup](../README.md) › ["odis.mock"](../modules/_odis_mock_.md) › [MockOdis](_odis_mock_.mockodis.md)

# Class: MockOdis

## Hierarchy

* **MockOdis**

## Index

### Properties

* [poprf](_odis_mock_.mockodis.md#readonly-poprf)
* [state](_odis_mock_.mockodis.md#readonly-state)
* [environment](_odis_mock_.mockodis.md#static-readonly-environment)

### Methods

* [install](_odis_mock_.mockodis.md#install)
* [installQuotaEndpoint](_odis_mock_.mockodis.md#installquotaendpoint)
* [installSignEndpoint](_odis_mock_.mockodis.md#installsignendpoint)
* [quota](_odis_mock_.mockodis.md#quota)
* [sign](_odis_mock_.mockodis.md#sign)

## Properties

### `Readonly` poprf

• **poprf**: *any* = new PoprfServer(MOCK_ODIS_KEYPAIR.privateKey)

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L32)*

___

### `Readonly` state

• **state**: *Record‹string, SequentialDelayDomainState›*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L31)*

___

### `Static` `Readonly` environment

▪ **environment**: *ServiceContext* = MOCK_ODIS_ENVIRONMENT

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L29)*

## Methods

###  install

▸ **install**(`mock`: typeof fetchMock): *void*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L171)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |

**Returns:** *void*

___

###  installQuotaEndpoint

▸ **installQuotaEndpoint**(`mock`: typeof fetchMock, `override?`: any): *void*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L137)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |
`override?` | any |

**Returns:** *void*

___

###  installSignEndpoint

▸ **installSignEndpoint**(`mock`: typeof fetchMock, `override?`: any): *void*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:154](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L154)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |
`override?` | any |

**Returns:** *void*

___

###  quota

▸ **quota**(`req`: DomainQuotaStatusRequest‹SequentialDelayDomain›): *object*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`req` | DomainQuotaStatusRequest‹SequentialDelayDomain› |

**Returns:** *object*

* **body**: *DomainQuotaStatusResponse*

* **status**: *number*

___

###  sign

▸ **sign**(`req`: DomainRestrictedSignatureRequest‹SequentialDelayDomain›): *object*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`req` | DomainRestrictedSignatureRequest‹SequentialDelayDomain› |

**Returns:** *object*

* **body**: *DomainRestrictedSignatureResponse*

* **status**: *number*
