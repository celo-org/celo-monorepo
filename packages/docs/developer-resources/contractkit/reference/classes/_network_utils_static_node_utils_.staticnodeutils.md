# Class: StaticNodeUtils

## Hierarchy

* **StaticNodeUtils**

## Index

### Methods

* [getStaticNodesAsync](_network_utils_static_node_utils_.staticnodeutils.md#static-getstaticnodesasync)
* [getStaticNodesGoogleStorageBucketName](_network_utils_static_node_utils_.staticnodeutils.md#static-getstaticnodesgooglestoragebucketname)

## Methods

### `Static` getStaticNodesAsync

▸ **getStaticNodesAsync**(`networkName`: string): *Promise‹string›*

*Defined in [contractkit/src/network-utils/static-node-utils.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/network-utils/static-node-utils.ts#L17)*

Fetches the static nodes (as JSON data) from Google Storage.
If the network is not working, the method will reject the returned promise
along with the response data from Google api.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`networkName` | string | Name of the network to fetch config for  |

**Returns:** *Promise‹string›*

___

### `Static` getStaticNodesGoogleStorageBucketName

▸ **getStaticNodesGoogleStorageBucketName**(): *string*

*Defined in [contractkit/src/network-utils/static-node-utils.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/network-utils/static-node-utils.ts#L7)*

**Returns:** *string*
