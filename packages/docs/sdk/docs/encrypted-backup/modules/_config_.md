[@celo/encrypted-backup](../README.md) › ["config"](_config_.md)

# Module: "config"

## Index

### Enumerations

* [ComputationalHardeningFunction](../enums/_config_.computationalhardeningfunction.md)
* [EnvironmentIdentifier](../enums/_config_.environmentidentifier.md)

### Interfaces

* [CircuitBreakerConfig](../interfaces/_config_.circuitbreakerconfig.md)
* [HardeningConfig](../interfaces/_config_.hardeningconfig.md)
* [OdisHardeningConfig](../interfaces/_config_.odishardeningconfig.md)
* [PbkdfConfig](../interfaces/_config_.pbkdfconfig.md)
* [ScryptConfig](../interfaces/_config_.scryptconfig.md)

### Type aliases

* [ComputationalHardeningConfig](_config_.md#computationalhardeningconfig)

### Object literals

* [PASSWORD_HARDENING_ALFAJORES_CONFIG](_config_.md#const-password_hardening_alfajores_config)
* [PASSWORD_HARDENING_MAINNET_CONFIG](_config_.md#const-password_hardening_mainnet_config)
* [PIN_HARDENING_ALFAJORES_CONFIG](_config_.md#const-pin_hardening_alfajores_config)
* [PIN_HARDENING_MAINNET_CONFIG](_config_.md#const-pin_hardening_mainnet_config)

## Type aliases

###  ComputationalHardeningConfig

Ƭ **ComputationalHardeningConfig**: *[PbkdfConfig](../interfaces/_config_.pbkdfconfig.md) | [ScryptConfig](../interfaces/_config_.scryptconfig.md)*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L71)*

## Object literals

### `Const` PASSWORD_HARDENING_ALFAJORES_CONFIG

### ▪ **PASSWORD_HARDENING_ALFAJORES_CONFIG**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:289](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L289)*

▪ **computational**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:294](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L294)*

* **blockSize**: *number* = 8

* **cost**: *number* = 32768

* **function**: *[SCRYPT](../enums/_config_.computationalhardeningfunction.md#scrypt)* = ComputationalHardeningFunction.SCRYPT

* **parallelization**: *number* = 1

▪ **odis**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:290](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L290)*

* **environment**: *ServiceContext* = ODIS_ALFAJORES_CONTEXT

* **rateLimit**: *SequentialDelayStage[]* = PASSWORD_HARDENING_RATE_LIMIT

___

### `Const` PASSWORD_HARDENING_MAINNET_CONFIG

### ▪ **PASSWORD_HARDENING_MAINNET_CONFIG**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:276](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L276)*

▪ **computational**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:281](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L281)*

* **blockSize**: *number* = 8

* **cost**: *number* = 32768

* **function**: *[SCRYPT](../enums/_config_.computationalhardeningfunction.md#scrypt)* = ComputationalHardeningFunction.SCRYPT

* **parallelization**: *number* = 1

▪ **odis**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:277](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L277)*

* **environment**: *ServiceContext* = ODIS_MAINNET_CONTEXT

* **rateLimit**: *SequentialDelayStage[]* = PASSWORD_HARDENING_RATE_LIMIT

___

### `Const` PIN_HARDENING_ALFAJORES_CONFIG

### ▪ **PIN_HARDENING_ALFAJORES_CONFIG**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:266](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L266)*

▪ **circuitBreaker**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:271](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L271)*

* **environment**: *CircuitBreakerServiceContext* = VALORA_ALFAJORES_CIRCUIT_BREAKER_ENVIRONMENT

▪ **odis**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L267)*

* **environment**: *ServiceContext* = ODIS_ALFAJORES_CONTEXT

* **rateLimit**: *SequentialDelayStage[]* = PIN_HARDENING_RATE_LIMIT

___

### `Const` PIN_HARDENING_MAINNET_CONFIG

### ▪ **PIN_HARDENING_MAINNET_CONFIG**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:256](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L256)*

▪ **circuitBreaker**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:261](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L261)*

* **environment**: *CircuitBreakerServiceContext* = VALORA_MAINNET_CIRCUIT_BREAKER_ENVIRONMENT

▪ **odis**: *object*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:257](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L257)*

* **environment**: *ServiceContext* = ODIS_MAINNET_CONTEXT

* **rateLimit**: *SequentialDelayStage[]* = PIN_HARDENING_RATE_LIMIT
