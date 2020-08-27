import { sleep } from '@celo/utils/lib/async'
import { intersection } from '@celo/utils/lib/collections'
import { E164Number } from '@celo/utils/lib/io'
import { PhoneNumberUtil } from 'google-libphonenumber'
import {
  findAttestationByDeliveryId,
  findAttestationByKey,
  findOrCreateAttestation,
  sequelize,
} from '../db'
import { fetchEnv, fetchEnvOrDefault } from '../env'
import { rootLogger } from '../logger'
import { Counters } from '../metrics'
import { AttestationKey, AttestationModel, AttestationStatus } from '../models/attestation'
import { DeliveryStatus, obfuscateNumber, SmsProvider, SmsProviderType } from './base'
import { NexmoSmsProvider } from './nexmo'
import { TwilioSmsProvider } from './twilio'

const smsProviders: SmsProvider[] = []
const smsProvidersByType: any = {}

const phoneUtil = PhoneNumberUtil.getInstance()

export async function initializeSmsProviders(
  deliveryStatusURLForProviderType: (type: string) => string
) {
  const smsProvidersToConfigure = fetchEnv('SMS_PROVIDERS')
    .split(',')
    .filter((t) => t != null && t !== '') as Array<SmsProviderType | string>

  if (smsProvidersToConfigure.length === 0) {
    throw new Error('You have to specify at least one sms provider')
  }

  for (const configuredSmsProvider of smsProvidersToConfigure) {
    if (smsProvidersByType[configuredSmsProvider]) {
      throw new Error(`Providers in SMS_PROVIDERS must be unique: dupe: ${configuredSmsProvider}`)
    }
    switch (configuredSmsProvider) {
      case SmsProviderType.NEXMO:
        const nexmoProvider = NexmoSmsProvider.fromEnv()
        await nexmoProvider.initialize()
        smsProviders.push(nexmoProvider)
        smsProvidersByType[SmsProviderType.NEXMO] = nexmoProvider
        break
      case SmsProviderType.TWILIO:
        const twilioProvider = TwilioSmsProvider.fromEnv()
        await twilioProvider.initialize(deliveryStatusURLForProviderType(configuredSmsProvider))
        smsProviders.push(twilioProvider)
        smsProvidersByType[SmsProviderType.TWILIO] = twilioProvider
        break
      default:
        throw new Error(`Unknown sms provider type specified: ${configuredSmsProvider}`)
    }
  }
}

// Return all SMS providers for the given phone number, in order of preference for that region,
// and not including any providers that has that region on its denylist.
export function smsProvidersFor(countryCode: string, phoneNumber: E164Number) {
  const providersForRegion = fetchEnvOrDefault(`SMS_PROVIDERS_${countryCode}`, '')
    .split(',')
    .filter((t) => t != null && t !== '')
  let providers =
    providersForRegion.length === 0
      ? smsProviders
      : providersForRegion.map((name) => smsProvidersByType[name])
  providers = providers.filter(
    (provider) => provider != null && provider.canServePhoneNumber(countryCode, phoneNumber)
  )
  if (providers.length === 0) {
    rootLogger.warn(
      {
        countryCode,
        phoneNumber: obfuscateNumber(phoneNumber),
        countryProvidersConfigValue: providersForRegion,
      },
      'No providers found that could serve number: check all providers are listed under SMS_PROVIDERS, ' +
        `check *_UNSUPPORTED_REGIONS are not overly restrictive, and that if provided SMS_PROVIDERS_${countryCode} lists valid providers`
    )
  } else {
    rootLogger.debug(
      {
        countryCode,
        phoneNumber: obfuscateNumber(phoneNumber),
        providers: providers.map((p) => p.type),
      },
      'Providers found'
    )
  }
  return providers
}

export function smsProviderOfType(type: string) {
  return smsProviders.find((provider) => provider.type === type)
}

export function configuredSmsProviders() {
  return smsProviders.map((provider) => provider.type)
}

export function smsProvidersWithDeliveryStatus() {
  return smsProviders.filter((provider) => provider.supportsDeliveryStatus())
}

export function unsupportedRegionCodes() {
  return intersection(smsProviders.map((provider) => provider.unsupportedRegionCodes))
}

// Maximum delivery attempts (including first) regardless of provider
const maxDeliveryAttempts = parseInt(fetchEnvOrDefault('MAX_DELIVERY_ATTEMPTS', '4'), 10)

// Main entry point for sending SMS via preferred providers.
// TODO pass through logging
export async function startSendSms(key: AttestationKey, phoneNumber: E164Number, message: string) {
  let shouldRetry = false
  let attestation: AttestationModel | null = null

  const transaction = await sequelize!.transaction({ logging: this.sequelizeLogger })

  try {
    const countryCode = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneNumber))
    const providers = countryCode ? smsProvidersFor(countryCode, phoneNumber) : []

    attestation = await findOrCreateAttestation(
      key,
      {
        account: key.account,
        issuer: key.issuer,
        identifier: key.identifier,
        phoneNumber,
        countryCode,
        status: AttestationStatus.Sent,
        message,
        providers: providers.join(','),
        attempt: 0,
      },
      transaction
    )

    if (!countryCode) {
      Counters.attestationRequestsUnableToServe.labels('unknown').inc()
      attestation.errorCode = `Could not parse ${phoneNumber}`
    }
    if (providers.length === 0) {
      Counters.attestationRequestsUnableToServe.labels(countryCode).inc()
      attestation.errorCode = `No SMS providers available for ${countryCode}`
    } else {
      // Parsed number and found providers. Attempt delivery.
      shouldRetry = await doSendSms(attestation, providers)
    }

    // rootLogger.info(
    //   {
    //     phoneNumber: obfuscateNumber(delivery.phoneNumber),
    //   },

    await attestation.save({ transaction, logging: this.sequelizeLogger })
    await transaction.commit()
  } catch (err) {
    this.logger.error({ err })
    await transaction.rollback()
  }

  // If there was an error sending, backoff and retry while holding open client conn.
  if (shouldRetry) {
    await sleep(Math.pow(2, attestation.attempt) * 500)
    await findAttestationAndSendSms(key, logger)
  }

  return attestation
}

async function findAttestationAndSendSms(key: AttestationKey, logger) {
  let shouldRetry = false

  const transaction = await sequelize!.transaction({ logging: this.sequelizeLogger })

  try {
    const attestation = await findAttestationByKey(key, transaction)
    if (!attestation) {
      return
    }

    const providers = getProvidersFor(attestation)

    // Parsed number and found providers. Attempt delivery.
    shouldRetry = await doSendSms(attestation, providers)

    await attestation.save({ transaction, logging: this.sequelizeLogger })
    await transaction.commit()
  } catch (err) {
    this.logger.error({ err })
    await transaction.rollback()
  }

  // If there was an error sending, backoff and retry while holding open client conn.
  if (shouldRetry) {
    await sleep(Math.pow(2, attestation.attempt) * 500)
    await findAttestationAndSendSms(key, logger)
  }
}

// Make first or next delivery attempt
async function doSendSms(
  attestation: AttestationModel,
  providers: any[],
  logger
): Promise<boolean> {
  const provider = providers[attestation.attempt % providers.length]

  try {
    rootLogger.info(
      {
        provider: provider.type,
        attempt: attestation.attempt,
      },
      'Attempting to create SMS'
    )

    const deliveryId = await provider.sendSms(attestation)

    attestation.status = AttestationStatus.Sent
    attestation.errorCode = null
    attestation.ongoingDeliveryId = deliveryId

    rootLogger.info(
      {
        provider: provider.type,
        attempt: attestation.attempt,
        deliveryId,
      },
      'Sent SMS'
    )

    Counters.attestationProviderDeliveryStatus
      .labels(provider.type, attestation.countryCode, DeliveryStatus[DeliveryStatus.Sent])
      .inc()

    return false
  } catch (error) {
    attestation.status = AttestationStatus.NotSent
    attestation.errorCode = error
    attestation.ongoingDeliveryId = null
    attestation.attempt += 1

    rootLogger.info(
      {
        provider: provider.type,
        attempt: attestation.attempt,
        error,
      },
      'SMS creation failed'
    )

    if (attestation.attempt > maxDeliveryAttempts) {
      logger.info('Final failure to send')
      return false
    }

    return true
  }
}

function getProvidersFor(attestation: AttestationModel) {
  const providers = smsProvidersFor(attestation.countryCode, attestation.phoneNumber)
  const providerString = providers.join(',')
  if (providerString !== attestation.providers) {
    throw new Error(
      `Detected inconsistent provider configuration between instances: ` +
        `got ${providerString} but attestation for ${attestation.countryCode} recorded ${attestation.providers}`
    )
  }
  return providers
}

// Act on a delivery report for an SMS, scheduling a resend if last one failed.
export async function receivedDeliveryReport(
  deliveryId: string,
  deliveryStatus: AttestationStatus,
  errorCode: string | null
) {
  let shouldRetry = false
  let attestation: AttestationModel | null = null

  const transaction = await sequelize!.transaction({ logging: this.sequelizeLogger })

  try {
    attestation = await findAttestationByDeliveryId(deliveryId, { transaction })

    if (!attestation || !attestation.countryCode) {
      // TODO log
      return
    }

    if (attestation.status !== deliveryStatus) {
      const providers = getProvidersFor(attestation)
      const provider = providers[attestation.attempt % providers.length]

      rootLogger.info(
        {
          provider: provider.type,
          phoneNumber: obfuscateNumber(delivery.phoneNumber),
          deliveryId,
          deliveryStatus: DeliveryStatus[deliveryStatus],
          errorCode,
        },
        'Received delivery status'
      )

      attestation.status = deliveryStatus

      const errors = attestation.errorCode ? JSON.parse(attestation.errorCode) : []
      attestation.errorCode = JSON.stringify(
        errors.append({ provider, errorCode, attempt: attestation.attempt })
      )

      Counters.attestationProviderDeliveryStatus
        .labels(provider.type, attestation.countryCode, DeliveryStatus[deliveryStatus])
        .inc()

      if (errorCode != null) {
        Counters.attestationProviderDeliveryErrorCodes
          .labels(provider.type, attestation.countryCode, errorCode)
          .inc()
      }

      if (deliveryStatus === DeliveryStatus.Failed) {
        attestation.ongoingDeliveryId = null
        attestation.attempt += 1

        if (attestation.attempt > maxDeliveryAttempts) {
          logger.info('Final failure to send')
        } else {
          shouldRetry = true
        }
      }
    }

    transaction.commit()
  } catch (err) {
    logger.error(err)
    transaction.rollback()
  }

  if (attestation && shouldRetry) {
    // TODO do this in the future
    await sleep(Math.pow(2, attestation.attempt) * 500)
    findAttestationAndSendSms(key, logger)
  }
}
