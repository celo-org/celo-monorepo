# Class: Lock

## Hierarchy

* **Lock**

## Index

### Constructors

* [constructor](_lock_.lock.md#constructor)

### Methods

* [acquire](_lock_.lock.md#acquire)
* [release](_lock_.lock.md#release)
* [tryAcquire](_lock_.lock.md#tryacquire)

## Constructors

###  constructor

\+ **new Lock**(): *[Lock](_lock_.lock.md)*

*Defined in [packages/sdk/base/src/lock.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/lock.ts#L12)*

**Returns:** *[Lock](_lock_.lock.md)*

## Methods

###  acquire

▸ **acquire**(): *Promise‹void›*

*Defined in [packages/sdk/base/src/lock.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/lock.ts#L29)*

**Returns:** *Promise‹void›*

___

###  release

▸ **release**(): *void*

*Defined in [packages/sdk/base/src/lock.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/lock.ts#L54)*

**Returns:** *void*

___

###  tryAcquire

▸ **tryAcquire**(): *boolean*

*Defined in [packages/sdk/base/src/lock.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/lock.ts#L20)*

**Returns:** *boolean*
