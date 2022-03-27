[@celo/encrypted-backup](../README.md) › ["config"](../modules/_config_.md) › [HardeningConfig](_config_.hardeningconfig.md)

# Interface: HardeningConfig

## Hierarchy

* **HardeningConfig**

## Index

### Properties

* [circuitBreaker](_config_.hardeningconfig.md#optional-circuitbreaker)
* [computational](_config_.hardeningconfig.md#optional-computational)
* [odis](_config_.hardeningconfig.md#optional-odis)

## Properties

### `Optional` circuitBreaker

• **circuitBreaker**? : *[CircuitBreakerConfig](_config_.circuitbreakerconfig.md)*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L33)*

If provided, a circuit breaker will be used with the given configuration to protect the backup key

___

### `Optional` computational

• **computational**? : *[ComputationalHardeningConfig](../modules/_config_.md#computationalhardeningconfig)*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L25)*

If provided, a computational hardening function (e.g. scrypt or PBKDF2) will be applied to
locally harden the backup encryption key.

**`remarks`** Recommended for password-encrypted backups, especially if a circuit breaker is not in
use, as this provides some degree of protection in the event of an ODIS compromise. When
generating backups on low-power devices (e.g. budget smart phones) and encrypting with
low-entropy secrets (e.g. 6-digit PINs) local hardening cannot offer significant protection.

___

### `Optional` odis

• **odis**? : *[OdisHardeningConfig](_config_.odishardeningconfig.md)*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L28)*

If provided, ODIS will be used with the given configuration to harden the backup key
