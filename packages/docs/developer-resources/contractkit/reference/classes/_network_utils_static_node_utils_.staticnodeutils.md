# Class: StaticNodeUtils

## Hierarchy

* **StaticNodeUtils**

## Index

### Methods

* [getRegionalStaticNodesAsync](_network_utils_static_node_utils_.staticnodeutils.md#static-getregionalstaticnodesasync)
* [getStaticNodeRegion](_network_utils_static_node_utils_.staticnodeutils.md#static-getstaticnoderegion)
* [getStaticNodesAsync](_network_utils_static_node_utils_.staticnodeutils.md#static-getstaticnodesasync)
* [getStaticNodesGoogleStorageBucketName](_network_utils_static_node_utils_.staticnodeutils.md#static-getstaticnodesgooglestoragebucketname)

## Methods

### `Static` getRegionalStaticNodesAsync

▸ **getRegionalStaticNodesAsync**(`networkName`: string, `region?`: undefined | string): *Promise‹string›*

*Defined in [packages/contractkit/src/network-utils/static-node-utils.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/network-utils/static-node-utils.ts#L110)*

Fetches the static nodes (as JSON data) from Google Storage corresponding
to the best available region for this caller.
If the network is not working, the method will reject the returned promise
along with the response data from Google API.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`networkName` | string | Name of the network to fetch config for  |
`region?` | undefined &#124; string | - |

**Returns:** *Promise‹string›*

___

### `Static` getStaticNodeRegion

▸ **getStaticNodeRegion**(`networkName`: string, `tz?`: undefined | string): *string*

*Defined in [packages/contractkit/src/network-utils/static-node-utils.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/network-utils/static-node-utils.ts#L88)*

Resolves the best region to use for static node connections.

**`remarks`** This method currently uses the interpreter's timezone and the
IANA timezone database to establish what region of the world the client is
in, then map that to a static list of static node clusters run by cLabs.
If the timezone is not set according to the user's location, this method
may route them to suboptimal set of static nodes. The resolution method
may be replaced in the future.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`networkName` | string | Name of the network to get a region for. |
`tz?` | undefined &#124; string | - |

**Returns:** *string*

___

### `Static` getStaticNodesAsync

▸ **getStaticNodesAsync**(`networkName`: string): *Promise‹string›*

*Defined in [packages/contractkit/src/network-utils/static-node-utils.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/network-utils/static-node-utils.ts#L123)*

Fetches the static nodes (as JSON data) from Google Storage.
If the network is not working, the method will reject the returned promise
along with the response data from Google API.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`networkName` | string | Name of the network to fetch config for  |

**Returns:** *Promise‹string›*

___

### `Static` getStaticNodesGoogleStorageBucketName

▸ **getStaticNodesGoogleStorageBucketName**(): *string*

*Defined in [packages/contractkit/src/network-utils/static-node-utils.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/network-utils/static-node-utils.ts#L74)*

**Returns:** *string*
