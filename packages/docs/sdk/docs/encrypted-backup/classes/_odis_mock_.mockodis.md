[@celo/encrypted-backup](../README.md) › ["odis.mock"](../modules/_odis_mock_.md) › [MockOdis](_odis_mock_.mockodis.md)

# Class: MockOdis

## Hierarchy

* **MockOdis**

## Index

### Properties

* [state](_odis_mock_.mockodis.md#state)
* [environment](_odis_mock_.mockodis.md#static-readonly-environment)

### Methods

* [install](_odis_mock_.mockodis.md#install)
* [installQuotaEndpoint](_odis_mock_.mockodis.md#installquotaendpoint)
* [installSignEndpoint](_odis_mock_.mockodis.md#installsignendpoint)
* [quota](_odis_mock_.mockodis.md#quota)
* [sign](_odis_mock_.mockodis.md#sign)

## Properties

###  state

• **state**: *Record‹string, SequentialDelayDomainState›*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L28)*

___

### `Static` `Readonly` environment

▪ **environment**: *ServiceContext* = MOCK_ODIS_ENVIRONMENT

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L26)*

## Methods

###  install

▸ **install**(`mock`: typeof fetchMock): *void*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L146)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |

**Returns:** *void*

___

###  installQuotaEndpoint

▸ **installQuotaEndpoint**(`mock`: typeof fetchMock, `override?`: any): *void*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |
`override?` | any |

**Returns:** *void*

___

###  installSignEndpoint

▸ **installSignEndpoint**(`mock`: typeof fetchMock, `override?`: any): *void*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L129)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |
`override?` | any |

**Returns:** *void*

___

###  quota

▸ **quota**(`req`: DomainQuotaStatusRequest‹SequentialDelayDomain›): *object*

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L30)*

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

*Defined in [packages/sdk/encrypted-backup/src/odis.mock.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/odis.mock.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`req` | DomainRestrictedSignatureRequest‹SequentialDelayDomain› |

**Returns:** *object*

* **body**: *DomainRestrictedSignatureResponse*

* **status**: *number*
