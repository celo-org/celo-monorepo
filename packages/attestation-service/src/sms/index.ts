import { E164Number } from '@celo/phone-utils/lib/io'
import { sleep } from '@celo/utils/lib/async'
import { intersection } from '@celo/utils/lib/collections'
import Logger from 'bunyan'
import { PhoneNumberType, PhoneNumberUtil } from 'google-libphonenumber'
import { shuffle } from 'lodash'
import { Transaction } from 'sequelize'
import {
  findAttestationByDeliveryId,
  findAttestationByKey,
  findOrCreateAttestation,
  makeSequelizeLogger,
  sequelize,
  SequelizeLogger,
} from '../db'
import { fetchEnv, fetchEnvOrDefault, isYes } from '../env'
import { Counters } from '../metrics'
import { AttestationKey, AttestationModel, AttestationStatus } from '../models/attestation'
import { ErrorWithResponse } from '../request'
import { obfuscateNumber, SmsProvider, SmsProviderType } from './base'
import { MessageBirdSmsProvider } from './messagebird'
import { NexmoSmsProvider } from './nexmo'
import { TelekomSmsProvider } from './telekom'
import { TwilioMessagingProvider, TwilioVerifyProvider } from './twilio'

// Maximum delivery attempts (including first) regardless of provider
const maxDeliveryAttempts = parseInt(
  fetchEnvOrDefault('MAX_DELIVERY_ATTEMPTS', fetchEnvOrDefault('MAX_PROVIDER_RETRIES', '3')),
  10
)

// Time within which we allow forcing a retry of completed (or any state) attestations
const allowRetryWithinCompletedMs =
  1000 * 60 * parseInt(fetchEnvOrDefault('MAX_REREQUEST_MINS', '55'), 10)
const maxErrorLength = 255

const smsProviders: SmsProvider[] = []
const smsProvidersByType: any = {}

const phoneUtil = PhoneNumberUtil.getInstance()

// Sadly PhoneNumberType doesn't have associated string literals
function phoneNumberTypeToString(t: PhoneNumberType): string {
  switch (t) {
    case PhoneNumberType.FIXED_LINE:
      return 'fixed_line'
    case PhoneNumberType.MOBILE:
      return 'mobile'
    case PhoneNumberType.FIXED_LINE_OR_MOBILE:
      return 'fixed_line_or_mobile'
    case PhoneNumberType.TOLL_FREE:
      return 'toll_free'
    case PhoneNumberType.PREMIUM_RATE:
      return 'premium_rate'
    case PhoneNumberType.SHARED_COST:
      return 'shared_cost'
    case PhoneNumberType.VOIP:
      return 'voip'
    case PhoneNumberType.PERSONAL_NUMBER:
      return 'personal_number'
    case PhoneNumberType.PAGER:
      return 'pager'
    case PhoneNumberType.UAN:
      return 'uan'
    case PhoneNumberType.VOICEMAIL:
      return 'voicemail'
    case PhoneNumberType.UNKNOWN:
      return 'unknown'
  }
}

function providerNamesToList(providers: string) {
  return (
    providers
      // Backwards compatibility: 'twilio' as syntactic sugar for 'twilioverify,twiliomessaging'
      .replace(
        new RegExp(`\\b(${SmsProviderType.TWILIO})\\b`, 'g'),
        `${SmsProviderType.TWILIO_VERIFY},${SmsProviderType.TWILIO_MESSAGING}`
      )
      .split(',')
      .filter((t) => t != null && t !== '')
  )
}

export async function initializeSmsProviders(
  deliveryStatusURLForProviderType: (type: string) => string
) {
  const smsProvidersToConfigure = providerNamesToList(fetchEnv('SMS_PROVIDERS'))
  if (smsProvidersToConfigure.length === 0) {
    throw new Error('You have to specify at least one sms provider')
  }

  for (const configuredSmsProvider of smsProvidersToConfigure) {
    if (smsProvidersByType[configuredSmsProvider]) {
      throw new Error(`Providers in SMS_PROVIDERS must be unique: dupe: ${configuredSmsProvider}`)
    }
    switch (configuredSmsProvider) {
      case SmsProviderType.TELEKOM:
        const telekomProvider = TelekomSmsProvider.fromEnv()
        await telekomProvider.initialize(deliveryStatusURLForProviderType(configuredSmsProvider))
        smsProviders.push(telekomProvider)
        smsProvidersByType[SmsProviderType.TELEKOM] = telekomProvider
        break
      case SmsProviderType.MESSAGEBIRD:
        const messageBirdProvider = MessageBirdSmsProvider.fromEnv()
        await messageBirdProvider.initialize(
          deliveryStatusURLForProviderType(configuredSmsProvider)
        )
        smsProviders.push(messageBirdProvider)
        smsProvidersByType[SmsProviderType.MESSAGEBIRD] = messageBirdProvider
        break
      case SmsProviderType.NEXMO:
        const nexmoProvider = NexmoSmsProvider.fromEnv()
        await nexmoProvider.initialize(deliveryStatusURLForProviderType(configuredSmsProvider))
        smsProviders.push(nexmoProvider)
        smsProvidersByType[SmsProviderType.NEXMO] = nexmoProvider
        break
      case SmsProviderType.TWILIO_VERIFY:
        const twilioVerifyProvider = TwilioVerifyProvider.fromEnv()
        await twilioVerifyProvider.initialize(
          deliveryStatusURLForProviderType(configuredSmsProvider)
        )
        smsProviders.push(twilioVerifyProvider)
        smsProvidersByType[SmsProviderType.TWILIO_VERIFY] = twilioVerifyProvider
        break
      case SmsProviderType.TWILIO_MESSAGING:
        const twilioMessagingProvider = TwilioMessagingProvider.fromEnv()
        await twilioMessagingProvider.initialize(
          deliveryStatusURLForProviderType(configuredSmsProvider)
        )
        smsProviders.push(twilioMessagingProvider)
        smsProvidersByType[SmsProviderType.TWILIO_MESSAGING] = twilioMessagingProvider
        break
      default:
        throw new Error(`Unknown sms provider type specified: ${configuredSmsProvider}`)
    }
  }
}

// Return all SMS providers for the given phone number, in order of preference for that region,
// and not including any providers that has that region on its denylist.
function smsProvidersFor(
  countryCode: string,
  phoneNumber: E164Number,
  logger: Logger
): SmsProvider[] {
  const providersForRegion = providerNamesToList(
    fetchEnvOrDefault(`SMS_PROVIDERS_${countryCode}`, '')
  )
  let providers =
    providersForRegion.length > 0
      ? providersForRegion.map((name) => smsProvidersByType[name])
      : // Use default list of providers, possibly shuffled (per-country provider lists are never shuffled)
      isYes(fetchEnvOrDefault('SMS_PROVIDERS_RANDOMIZED', '0'))
      ? shuffle(smsProviders)
      : smsProviders
  providers = providers.filter(
    (provider) => provider != null && provider.canServePhoneNumber(countryCode, phoneNumber)
  )
  if (providers.length === 0) {
    logger.warn(
      {
        countryCode,
        phoneNumber: obfuscateNumber(phoneNumber),
        countryProvidersConfigValue: providersForRegion,
      },
      'No providers found that could serve number: check all providers are listed under SMS_PROVIDERS, ' +
        `check *_UNSUPPORTED_REGIONS are not overly restrictive, and that if provided SMS_PROVIDERS_${countryCode} lists valid providers`
    )
  } else {
    logger.debug(
      {
        countryCode,
        phoneNumber: obfuscateNumber(phoneNumber),
        providers: providers.map((provider) => provider.type),
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
  return smsProviders.filter((provider) => provider.deliveryStatusMethod())
}

export function unsupportedRegionCodes() {
  return intersection(smsProviders.map((provider) => provider.unsupportedRegionCodes))
}

function providersToCsv(providers: SmsProvider[]) {
  return providers.map((provider) => provider.type).join(',')
}

// This list may be a strict subset of the valid providers (e.g. when forcing a provider for a test),
// but cannot require providers not configured or unsupported for this country code.
function getProvidersFor(attestation: AttestationModel, logger: Logger) {
  const validProviders = smsProvidersFor(attestation.countryCode, attestation.phoneNumber, logger)
  const attestationProviders = providerNamesToList(attestation.providers).map(
    (name) => smsProvidersByType[name]
  )

  for (const p of attestationProviders) {
    if (!validProviders.find((v) => p.type === v.type)) {
      throw new Error(`Detected inconsistent provider configuration between instances`)
    }
  }
  return attestationProviders
}

// Main entry point for sending SMS.
export async function startSendSms(
  key: AttestationKey,
  phoneNumber: E164Number,
  messageToSend: string,
  securityCode: string | null = null,
  attestationCode: string | null = null,
  appSignature: string | undefined,
  language: string | undefined,
  logger: Logger,
  sequelizeLogger: SequelizeLogger,
  onlyUseProvider: string | null = null
): Promise<AttestationModel> {
  let shouldRetry = false
  let attestation: AttestationModel | null = null

  const transaction = await sequelize!.transaction({
    logging: sequelizeLogger,
    type: Transaction.TYPES.IMMEDIATE,
  })

  try {
    const parsedNumber = phoneUtil.parse(phoneNumber)
    const numberType = parsedNumber ? phoneUtil.getNumberType(parsedNumber) : null
    const countryCode = parsedNumber ? phoneUtil.getRegionCodeForNumber(parsedNumber) : null

    let providers: SmsProvider[] = countryCode
      ? smsProvidersFor(countryCode, phoneNumber, logger)
      : []

    if (onlyUseProvider) {
      // If onlyUseProvider is specified, filter returned list to make it only item.
      providers = providers.filter((provider) => provider.type === onlyUseProvider!)
    }

    attestation = await findOrCreateAttestation(
      key,
      {
        phoneNumber,
        countryCode,
        status: AttestationStatus.NotSent,
        message: messageToSend,
        attestationCode,
        providers: providersToCsv(providers),
        attempt: 0,
        errors: undefined,
        ongoingDeliveryId: null,
        securityCode,
        securityCodeAttempt: 0,
        appSignature,
        language,
      },
      transaction
    )

    if (!countryCode) {
      Counters.attestationRequestsUnableToServe.labels('unknown').inc()
      attestation.recordError(`Could not parse ${phoneNumber}`)
    } else if (providers.length === 0) {
      Counters.attestationRequestsUnableToServe.labels(countryCode).inc()
      attestation.recordError(`No matching SMS providers`)
    } else {
      if (numberType !== null) {
        Counters.attestationRequestsByNumberType
          .labels(countryCode, phoneNumberTypeToString(numberType))
          .inc()
      }

      // Parsed number and found providers. Attempt delivery.
      shouldRetry = await doSendSms(attestation, providers, logger)
    }

    await attestation.save({ transaction, logging: sequelizeLogger })
    await transaction.commit()
  } catch (err) {
    logger.error({ err })
    await transaction.rollback()
    throw err
  }

  // If there was an error sending, backoff and retry while holding open client conn.
  if (shouldRetry && attestation) {
    await sleep(Math.pow(2, attestation!.attempt) * 1000)
    attestation = await findAttestationAndSendSms(key, logger, sequelizeLogger)
  }

  return attestation
}

// Force an existing attestation (could have received a delivery status or not) to be rerequested
// immediately if there are sufficient attempts remaining.
export async function rerequestAttestation(
  key: AttestationKey,
  appSignature: string | undefined,
  language: string | undefined,
  securityCodePrefix: string,
  logger: Logger,
  sequelizeLogger: SequelizeLogger
): Promise<AttestationModel> {
  let shouldRetry = false
  let attestation: AttestationModel | null = null

  const transaction = await sequelize!.transaction({
    logging: sequelizeLogger,
    type: Transaction.TYPES.IMMEDIATE,
  })

  try {
    attestation = await findAttestationByKey(key, { transaction, lock: Transaction.LOCK.UPDATE })
    if (!attestation) {
      throw new Error('Cannot retrieve attestation')
    }
    // For backward compatibility
    // Can be removed after 1.3.0
    if (!attestation.appSignature) {
      attestation.appSignature = appSignature
    }
    if (!attestation.language) {
      attestation.language = language
    }
    // Old security code approach did not store the prefix
    if (attestation.securityCode?.length === 7) {
      attestation.securityCode = `${securityCodePrefix}${attestation.securityCode}`
    }

    if (attestation.completedAt) {
      const completedAgo = Date.now() - attestation.completedAt!.getTime()
      if (completedAgo >= allowRetryWithinCompletedMs) {
        Counters.attestationRequestsAlreadySent.inc()
        throw new ErrorWithResponse('Attestation can no longer be rerequested', 422)
      }
    }

    attestation.recordError(`Rerequested when status was ${AttestationStatus[attestation.status]}`)
    attestation.status = AttestationStatus.NotSent
    attestation.ongoingDeliveryId = null
    attestation.completedAt = null
    attestation.attempt += 1

    if (attestation.attempt >= maxDeliveryAttempts) {
      Counters.attestationRequestsAlreadySent.inc()
      throw new ErrorWithResponse('Delivery attempts exceeded', 422)
    }

    const providers = getProvidersFor(attestation, logger)
    shouldRetry = await doSendSms(attestation, providers, logger)

    await attestation.save({ transaction, logging: sequelizeLogger })
    await transaction.commit()
  } catch (err) {
    logger.error({ err })
    await transaction.rollback()
    throw err
  }

  // If there was an error sending, backoff and retry while holding open client conn.
  if (shouldRetry && attestation) {
    await sleep(Math.pow(2, attestation.attempt) * 1000)
    attestation = await findAttestationAndSendSms(key, logger, sequelizeLogger)
  }

  return attestation
}

async function findAttestationAndSendSms(
  key: AttestationKey,
  logger: Logger,
  sequelizeLogger: SequelizeLogger
): Promise<AttestationModel> {
  let shouldRetry = false
  let attestation: AttestationModel | null = null

  const transaction = await sequelize!.transaction({
    logging: sequelizeLogger,
    type: Transaction.TYPES.IMMEDIATE,
  })

  try {
    attestation = await findAttestationByKey(key, { transaction, lock: Transaction.LOCK.UPDATE })
    if (!attestation) {
      throw new Error('Cannot retrieve attestation')
    }

    const providers = getProvidersFor(attestation, logger)

    // Parsed number and found providers. Attempt delivery.
    shouldRetry = await doSendSms(attestation, providers, logger)

    await attestation.save({ transaction, logging: sequelizeLogger })
    await transaction.commit()
  } catch (err) {
    logger.error({ err })
    await transaction.rollback()
    throw err
  }

  // If there was an error sending, backoff and retry while holding open client conn.
  if (shouldRetry && attestation) {
    await sleep(Math.pow(2, attestation.attempt) * 1000)
    attestation = await findAttestationAndSendSms(key, logger, sequelizeLogger)
  }

  return attestation
}

// Make first or next delivery attempt -- returns true if we should retry.
async function doSendSms(
  attestation: AttestationModel,
  providers: SmsProvider[],
  logger: Logger
): Promise<boolean> {
  const provider = providers[attestation.attempt % providers.length]

  try {
    logger.info(
      {
        provider: provider.type,
        attempt: attestation.attempt,
      },
      'Attempting to create SMS'
    )

    const deliveryId = await provider.sendSms(attestation)

    attestation.status = AttestationStatus.Sent
    attestation.ongoingDeliveryId = deliveryId

    logger.info(
      {
        provider: provider.type,
        attempt: attestation.attempt,
        deliveryId,
      },
      'Sent SMS'
    )

    Counters.attestationProviderDeliveryStatus
      .labels(provider.type, attestation.countryCode, AttestationStatus[AttestationStatus.Sent])
      .inc()

    return false
  } catch (error: any) {
    attestation.status = AttestationStatus.NotSent
    const errorMsg = `${error.message ?? error}`.slice(0, maxErrorLength)
    attestation.recordError(errorMsg)
    attestation.ongoingDeliveryId = null
    attestation.attempt += 1

    logger.info(
      {
        provider: provider.type,
        attempt: attestation.attempt,
        error: errorMsg,
      },
      'SMS creation failed'
    )

    if (attestation.attempt >= maxDeliveryAttempts) {
      attestation.completedAt = new Date()
      logger.info('Final failure to send')
      Counters.attestationRequestsFailedToDeliverSms.inc()
      return false
    }

    return true
  }
}

// Act on a delivery report for an SMS, scheduling a resend if last one failed.
export async function receivedDeliveryReport(
  deliveryId: string,
  deliveryStatus: AttestationStatus,
  errorCode: string | null,
  logger: Logger
) {
  if (!deliveryId) {
    return
  }

  let shouldRetry = false
  let attestation: AttestationModel | null = null

  let childLogger = logger.child({
    deliveryId,
  })
  const sequelizeLogger = makeSequelizeLogger(childLogger)
  const transaction = await sequelize!.transaction({
    logging: sequelizeLogger,
    type: Transaction.TYPES.IMMEDIATE,
  })

  try {
    attestation = await findAttestationByDeliveryId(deliveryId, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    })

    if (attestation) {
      // First time we can associate this info with the request.
      childLogger = logger.child({
        issuer: attestation.issuer,
        phoneNumber: obfuscateNumber(attestation.phoneNumber),
      })

      if (attestation.status < deliveryStatus) {
        const providers = getProvidersFor(attestation, childLogger)
        const provider = providers[attestation.attempt % providers.length]

        childLogger.info(
          {
            provider: provider.type,
            status: AttestationStatus[deliveryStatus],
            errorCode,
          },
          'Received delivery status'
        )

        attestation.status = deliveryStatus

        Counters.attestationProviderDeliveryStatus
          .labels(provider.type, attestation.countryCode, AttestationStatus[deliveryStatus])
          .inc()

        if (errorCode != null) {
          Counters.attestationProviderDeliveryErrorCodes
            .labels(provider.type, attestation.countryCode, errorCode)
            .inc()
        }

        if (deliveryStatus === AttestationStatus.Failed) {
          // Record the error before incrementing attempt
          attestation.recordError(errorCode ?? 'Failed')

          // Next attempt
          attestation.ongoingDeliveryId = null
          attestation.attempt += 1

          if (attestation.attempt >= maxDeliveryAttempts) {
            attestation.completedAt = new Date()
            logger.info(
              {
                deliveryId,
              },
              'Final failure to send'
            )
            Counters.attestationRequestsFailedToDeliverSms.inc()
          } else {
            shouldRetry = true
          }
        } else if (deliveryStatus === AttestationStatus.Delivered) {
          attestation.completedAt = new Date()
          Counters.attestationRequestsBelievedDelivered.inc()
          attestation.ongoingDeliveryId = null
        }
      }
      await attestation.save({ transaction, logging: sequelizeLogger })
    }
    transaction.commit()
  } catch (err) {
    childLogger.error(err)
    transaction.rollback()
  }

  if (attestation && shouldRetry) {
    const key = attestation.key()
    const timeout = Math.pow(2, attestation.attempt) * 1000
    setTimeout(() => findAttestationAndSendSms(key, childLogger, sequelizeLogger), timeout)
  }
}
