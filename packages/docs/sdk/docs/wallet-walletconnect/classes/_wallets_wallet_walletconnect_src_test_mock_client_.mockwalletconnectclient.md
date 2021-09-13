[@celo/wallet-walletconnect](../README.md) › ["wallets/wallet-walletconnect/src/test/mock-client"](../modules/_wallets_wallet_walletconnect_src_test_mock_client_.md) › [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md)

# Class: MockWalletConnectClient

## Hierarchy

* EventEmitter

  ↳ **MockWalletConnectClient**

## Index

### Constructors

* [constructor](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#constructor)

### Properties

* [defaultMaxListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#static-defaultmaxlisteners)
* [errorMonitor](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#static-readonly-errormonitor)

### Methods

* [addListener](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#addlistener)
* [connect](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#connect)
* [disconnect](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#disconnect)
* [emit](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#emit)
* [eventNames](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#eventnames)
* [getMaxListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#getmaxlisteners)
* [init](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#init)
* [listenerCount](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#listenercount)
* [listeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#listeners)
* [off](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#off)
* [on](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#on)
* [once](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#once)
* [prependListener](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#prependlistener)
* [prependOnceListener](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#prependoncelistener)
* [rawListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#rawlisteners)
* [removeAllListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#removealllisteners)
* [removeListener](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#removelistener)
* [request](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#request)
* [setMaxListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#setmaxlisteners)
* [listenerCount](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#static-listenercount)

## Constructors

###  constructor

\+ **new MockWalletConnectClient**(`options?`: EventEmitterOptions): *[MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md)*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[constructor](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#constructor)*

Defined in node_modules/@types/node/events.d.ts:41

**Parameters:**

Name | Type |
------ | ------ |
`options?` | EventEmitterOptions |

**Returns:** *[MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md)*

## Properties

### `Static` defaultMaxListeners

▪ **defaultMaxListeners**: *number*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[defaultMaxListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#static-defaultmaxlisteners)*

Defined in node_modules/@types/node/events.d.ts:45

___

### `Static` `Readonly` errorMonitor

▪ **errorMonitor**: *unique symbol*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[errorMonitor](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#static-readonly-errormonitor)*

Defined in node_modules/@types/node/events.d.ts:55

This symbol shall be used to install a listener for only monitoring `'error'`
events. Listeners installed using this symbol are called before the regular
`'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an
`'error'` event is emitted, therefore the process will still crash if no
regular `'error'` listener is installed.

## Methods

###  addListener

▸ **addListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[addListener](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#addlistener)*

Defined in node_modules/@types/node/events.d.ts:62

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  connect

▸ **connect**(): *Promise‹void›*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/mock-client.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/mock-client.ts#L21)*

**Returns:** *Promise‹void›*

___

###  disconnect

▸ **disconnect**(): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/mock-client.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/mock-client.ts#L77)*

**Returns:** *void*

___

###  emit

▸ **emit**(`event`: string | symbol, ...`args`: any[]): *boolean*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[emit](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#emit)*

Defined in node_modules/@types/node/events.d.ts:72

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |
`...args` | any[] |

**Returns:** *boolean*

___

###  eventNames

▸ **eventNames**(): *Array‹string | symbol›*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[eventNames](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#eventnames)*

Defined in node_modules/@types/node/events.d.ts:77

**Returns:** *Array‹string | symbol›*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[getMaxListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#getmaxlisteners)*

Defined in node_modules/@types/node/events.d.ts:69

**Returns:** *number*

___

###  init

▸ **init**(): *void*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/mock-client.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/mock-client.ts#L19)*

**Returns:** *void*

___

###  listenerCount

▸ **listenerCount**(`type`: string | symbol): *number*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[listenerCount](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#listenercount)*

Defined in node_modules/@types/node/events.d.ts:73

**Parameters:**

Name | Type |
------ | ------ |
`type` | string &#124; symbol |

**Returns:** *number*

___

###  listeners

▸ **listeners**(`event`: string | symbol): *Function[]*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[listeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#listeners)*

Defined in node_modules/@types/node/events.d.ts:70

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  off

▸ **off**(`event`: string | symbol, `listener`: function): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[off](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#off)*

Defined in node_modules/@types/node/events.d.ts:66

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  on

▸ **on**(`event`: string | symbol, `listener`: function): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[on](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#on)*

Defined in node_modules/@types/node/events.d.ts:63

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  once

▸ **once**(`event`: string | symbol, `listener`: function): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[once](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#once)*

Defined in node_modules/@types/node/events.d.ts:64

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  prependListener

▸ **prependListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[prependListener](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#prependlistener)*

Defined in node_modules/@types/node/events.d.ts:75

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  prependOnceListener

▸ **prependOnceListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[prependOnceListener](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#prependoncelistener)*

Defined in node_modules/@types/node/events.d.ts:76

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  rawListeners

▸ **rawListeners**(`event`: string | symbol): *Function[]*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[rawListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#rawlisteners)*

Defined in node_modules/@types/node/events.d.ts:71

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: string | symbol): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[removeAllListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#removealllisteners)*

Defined in node_modules/@types/node/events.d.ts:67

**Parameters:**

Name | Type |
------ | ------ |
`event?` | string &#124; symbol |

**Returns:** *this*

___

###  removeListener

▸ **removeListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[removeListener](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#removelistener)*

Defined in node_modules/@types/node/events.d.ts:65

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  request

▸ **request**(`event`: RequestEvent): *Promise‹undefined | string | EncodedTransaction›*

*Defined in [packages/sdk/wallets/wallet-walletconnect/src/test/mock-client.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-walletconnect/src/test/mock-client.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`event` | RequestEvent |

**Returns:** *Promise‹undefined | string | EncodedTransaction›*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: number): *this*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[setMaxListeners](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#setmaxlisteners)*

Defined in node_modules/@types/node/events.d.ts:68

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *this*

___

### `Static` listenerCount

▸ **listenerCount**(`emitter`: EventEmitter, `event`: string | symbol): *number*

*Inherited from [MockWalletConnectClient](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md).[listenerCount](_wallets_wallet_walletconnect_src_test_mock_client_.mockwalletconnectclient.md#static-listenercount)*

Defined in node_modules/@types/node/events.d.ts:44

**`deprecated`** since v4.0.0

**Parameters:**

Name | Type |
------ | ------ |
`emitter` | EventEmitter |
`event` | string &#124; symbol |

**Returns:** *number*
