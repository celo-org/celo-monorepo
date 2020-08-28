import { sleep } from '@celo/utils/lib/async'
import { intersection } from '@celo/utils/lib/collections'
import { E164Number } from '@celo/utils/lib/io'
import { PhoneNumberUtil } from 'google-libphonenumber'
import { fetchEnv, fetchEnvOrDefault } from '../env'
import { rootLogger } from '../logger'
import { Counters } from '../metrics'
import { DeliveryStatus, obfuscateNumber, SmsDelivery, SmsProvider, SmsProviderType } from './base'
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

// Main entry point for sending SMS via preferred providers.

export async function startSendSms(
  phoneNumber: E164Number,
  message: string,
  finallyFailedCallback?: () => void,
  finallyBelievedDeliveredCallback?: () => void
): Promise<SmsProviderType> {
  const countryCode = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneNumber))
  if (!countryCode) {
    throw new Error('Could not parse number')
  }

  const providers = smsProvidersFor(countryCode, phoneNumber)
  if (providers.length === 0) {
    Counters.attestationRequestsUnableToServe.labels(countryCode).inc()
    throw new Error(`No SMS providers available for ${countryCode}`)
  }

  const delivery: SmsDelivery = {
    countryCode,
    phoneNumber,
    message,
    providers,
    finallyFailedCallback,
    finallyBelievedDeliveredCallback,
    attemptsForThisProvider: 0,
    ongoingDeliveryId: null,
    status: DeliveryStatus.NotCreated,
  }

  return attemptToSendSms(delivery)
}

// Maximum delivery retries (after first) with any one provider
const maxProviderRetries = parseInt(fetchEnvOrDefault('MAX_PROVIDER_RETRIES', '2'), 10)

const ongoingDeliveries: any = {}

async function attemptToSendSms(delivery: SmsDelivery): Promise<SmsProviderType> {
  // If this is a retry, remove mapping for current id, ongoingDeliveryId.
  // The mapping is used to identify the delivery when a delivery receipt comes in,
  // and we no longer want to hear about duplicated receipts for that attempt.
  if (delivery.ongoingDeliveryId) {
    delete ongoingDeliveries[delivery.ongoingDeliveryId!]
    delivery.ongoingDeliveryId = null
  }

  // If retries to send with this provider are exceeded, move to next provider
  if (delivery.attemptsForThisProvider > maxProviderRetries) {
    delivery.providers = delivery.providers.slice(1)
    delivery.attemptsForThisProvider = 0
  }

  if (delivery.providers.length === 0) {
    // No more providers to try.
    rootLogger.info(
      {
        phoneNumber: obfuscateNumber(delivery.phoneNumber),
      },
      'Final failure to send'
    )

    if (delivery.finallyFailedCallback) {
      delivery.finallyFailedCallback()
    }
    throw new Error('Could not deliver via any provider')
  }

  // Attempt (re)delivery with this provider, and if that fails, backoff.
  delivery.attemptsForThisProvider++
  try {
    rootLogger.info(
      {
        provider: delivery.providers[0].type,
        phoneNumber: obfuscateNumber(delivery.phoneNumber),
        attempt: delivery.attemptsForThisProvider,
      },
      'Attempting to create SMS'
    )

    const deliveryId = await delivery.providers[0].sendSms(delivery)

    rootLogger.info(
      {
        provider: delivery.providers[0].type,
        phoneNumber: obfuscateNumber(delivery.phoneNumber),
        attempt: delivery.attemptsForThisProvider,
        deliveryId,
      },
      'Created SMS'
    )

    Counters.attestationProviderDeliveryStatus
      .labels(
        delivery.providers[0].type,
        delivery.countryCode,
        DeliveryStatus[DeliveryStatus.Created]
      )
      .inc()

    if (delivery.createdCallback) {
      delivery.createdCallback(delivery.providers[0].type)
    }

    // If this provider supports delivery status, track the delivery.
    if (delivery.providers[0].supportsDeliveryStatus()) {
      ongoingDeliveries[deliveryId!] = delivery
      delivery.ongoingDeliveryId = deliveryId
      delivery.status = DeliveryStatus.Created

      // Set timeout to callback with success and clean up in the event we
      // don't receive a delivery receipt AND no other retry has been made
      // since this one
      setTimeout(() => {
        if (delivery.ongoingDeliveryId === deliveryId) {
          delete ongoingDeliveries[deliveryId]
          if (delivery.finallyBelievedDeliveredCallback) {
            delivery.finallyBelievedDeliveredCallback()
          }
          delivery.ongoingDeliveryId = null
        }
      }, timeoutWaitingForDeliveryReceipt)
    }
    return delivery.providers[0].type
  } catch (error) {
    rootLogger.info(
      {
        provider: delivery.providers[0].type,
        phoneNumber: obfuscateNumber(delivery.phoneNumber),
        attempt: delivery.attemptsForThisProvider,
        error,
      },
      'SMS creation failed'
    )

    // Error sending. Set timeout to backoff and retry
    await sleep(Math.pow(2, delivery.attemptsForThisProvider) * 1000)
    return attemptToSendSms(delivery)
  }
}

// Timeout waiting for a delivery receipt (may never come, even on success) before delivery state is cleaned up
const timeoutWaitingForDeliveryReceipt =
  parseInt(fetchEnvOrDefault('TIMEOUT_CLEANUP_NO_RECEIPT_MIN', '10'), 10) * 60 * 1000

// Act on a delivery report for an SMS, scheduling a resend if last one failed.
export function receivedDeliveryReport(
  deliveryId: string,
  deliveryStatus: DeliveryStatus,
  errorCode: string | null
) {
  const delivery = ongoingDeliveries[deliveryId]
  if (delivery) {
    rootLogger.info(
      {
        provider: delivery.providers[0].type,
        phoneNumber: obfuscateNumber(delivery.phoneNumber),
        deliveryId,
        deliveryStatus: DeliveryStatus[deliveryStatus],
        errorCode,
      },
      'Received delivery status'
    )

    if (delivery.status !== deliveryStatus) {
      delivery.status = deliveryStatus

      Counters.attestationProviderDeliveryStatus
        .labels(delivery.providers[0].type, delivery.countryCode, DeliveryStatus[deliveryStatus])
        .inc()

      if (errorCode != null) {
        Counters.attestationProviderDeliveryErrorCodes
          .labels(delivery.providers[0].type, delivery.countryCode, errorCode)
          .inc()
      }
    }

    if (deliveryStatus === DeliveryStatus.Delivered) {
      delete ongoingDeliveries[deliveryId]
      ongoingDeliveries.deliveryId = null
      if (delivery.finallyBelievedDeliveredCallback) {
        delivery.finallyBelievedDeliveredCallback()
      }
    } else if (deliveryStatus === DeliveryStatus.Failed) {
      delete ongoingDeliveries[deliveryId]
      ongoingDeliveries.deliveryId = null
      setTimeout(() => {
        void attemptToSendSms(delivery)
      }, Math.pow(2, delivery.attemptsForThisProvider) * 3000)
    }
  }
}
