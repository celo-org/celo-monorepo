[@celo/encrypted-backup](../README.md) › ["config"](../modules/_config_.md) › [OdisHardeningConfig](_config_.odishardeningconfig.md)

# Interface: OdisHardeningConfig

Configuration for usage of ODIS to harden the encryption keys

## Hierarchy

* **OdisHardeningConfig**

## Index

### Properties

* [environment](_config_.odishardeningconfig.md#environment)
* [rateLimit](_config_.odishardeningconfig.md#ratelimit)

## Properties

###  environment

• **environment**: *OdisServiceContext*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L48)*

Environment information including the URL and public key of the ODIS service

___

###  rateLimit

• **rateLimit**: *SequentialDelayStage[]*

*Defined in [packages/sdk/encrypted-backup/src/config.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/config.ts#L45)*

Rate limiting information used to construct the ODIS domain which will be used to harden the
encryption key through ODIS' domain password hardening service.

**`remarks`** Currently supports the SequentialDelayDomain. In the future, as additional domains are
standardized for key hardening, they may be added here to allow a wider range of configuration.
