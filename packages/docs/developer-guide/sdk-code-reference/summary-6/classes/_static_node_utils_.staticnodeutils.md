# StaticNodeUtils

## Hierarchy

* **StaticNodeUtils**

## Index

### Methods

* [getRegionalStaticNodesAsync](_static_node_utils_.staticnodeutils.md#static-getregionalstaticnodesasync)
* [getStaticNodeRegion](_static_node_utils_.staticnodeutils.md#static-getstaticnoderegion)
* [getStaticNodesAsync](_static_node_utils_.staticnodeutils.md#static-getstaticnodesasync)
* [getStaticNodesGoogleStorageBucketName](_static_node_utils_.staticnodeutils.md#static-getstaticnodesgooglestoragebucketname)

## Methods

### `Static` getRegionalStaticNodesAsync

▸ **getRegionalStaticNodesAsync**\(`networkName`: string, `region?`: undefined \| string\): _Promise‹string›_

_Defined in_ [_static-node-utils.ts:110_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/network-utils/src/static-node-utils.ts#L110)

Fetches the static nodes \(as JSON data\) from Google Storage corresponding to the best available region for this caller. If the network is not working, the method will reject the returned promise along with the response data from Google API.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `networkName` | string | Name of the network to fetch config for |
| `region?` | undefined \| string | - |

**Returns:** _Promise‹string›_

### `Static` getStaticNodeRegion

▸ **getStaticNodeRegion**\(`networkName`: string, `tz?`: undefined \| string\): _string_

_Defined in_ [_static-node-utils.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/network-utils/src/static-node-utils.ts#L88)

Resolves the best region to use for static node connections.

**`remarks`** This method currently uses the interpreter's timezone and the IANA timezone database to establish what region of the world the client is in, then map that to a static list of static node clusters run by cLabs. If the timezone is not set according to the user's location, this method may route them to suboptimal set of static nodes. The resolution method may be replaced in the future.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `networkName` | string | Name of the network to get a region for. |
| `tz?` | undefined \| string | - |

**Returns:** _string_

### `Static` getStaticNodesAsync

▸ **getStaticNodesAsync**\(`networkName`: string\): _Promise‹string›_

_Defined in_ [_static-node-utils.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/network-utils/src/static-node-utils.ts#L123)

Fetches the static nodes \(as JSON data\) from Google Storage. If the network is not working, the method will reject the returned promise along with the response data from Google API.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `networkName` | string | Name of the network to fetch config for |

**Returns:** _Promise‹string›_

### `Static` getStaticNodesGoogleStorageBucketName

▸ **getStaticNodesGoogleStorageBucketName**\(\): _string_

_Defined in_ [_static-node-utils.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/network-utils/src/static-node-utils.ts#L74)

**Returns:** _string_

