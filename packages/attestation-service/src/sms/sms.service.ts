import { intersection, sleep } from '@celo/base'
import { E164Number } from '@celo/utils/lib/io'
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
import { obfuscateNumber } from '../helper/anonymity'
import { Counters } from '../metrics'
import { AttestationKey, AttestationModel, AttestationStatus } from '../models/attestation'
import { ErrorWithResponse } from '../request'
import { SmsProvider } from './provider/smsProvider'
import { SmsProviderType } from './provider/smsProvider.enum'
import { SmsProviderFactory } from './provider/smsProvider.factory'
import { RerequestAttestationRequest } from './requests/rerequestAttestation.request'
import { SendSmsRequest } from './requests/sendSms.request'
import { ISmsService } from './sms.interface'

const phoneUtil = PhoneNumberUtil.getInstance()

export class SmsService implements ISmsService {
  readonly smsProviderFactory = new SmsProviderFactory()
  readonly smsProviders: SmsProvider[] = []
  readonly smsProvidersByType: any = {}

  readonly maxDeliveryAttempts = parseInt(
    fetchEnvOrDefault('MAX_DELIVERY_ATTEMPTS', fetchEnvOrDefault('MAX_PROVIDER_RETRIES', '3')),
    10
  )
  readonly allowRetryWithinCompletedMs =
    1000 * 60 * parseInt(fetchEnvOrDefault('MAX_REREQUEST_MINS', '55'), 10)
  readonly maxErrorLength = 255

  async initializeSmsProviders(deliveryStatusURLForProviderType: (type: string) => string) {
    const smsProvidersToConfigure = fetchEnv('SMS_PROVIDERS')
      .split(',')
      .filter((t) => t != null && t !== '') as Array<SmsProviderType | string>

    if (smsProvidersToConfigure.length === 0) {
      throw new Error('You have to specify at least one sms provider')
    }

    for (const configuredSmsProvider of smsProvidersToConfigure) {
      if (this.smsProvidersByType[configuredSmsProvider]) {
        throw new Error(`Providers in SMS_PROVIDERS must be unique: dupe: ${configuredSmsProvider}`)
      }
      const configuredSmsProviderType = configuredSmsProvider as SmsProviderType

      const smsProvider = this.smsProviderFactory.createSmsProvider(configuredSmsProviderType)
      await smsProvider.initialize(deliveryStatusURLForProviderType(configuredSmsProvider))
      this.smsProviders.push(smsProvider)
      this.smsProvidersByType[configuredSmsProviderType] = smsProvider
    }
  }

  // Main entry point for sending SMS.
  async startSendSms({
    key,
    phoneNumber,
    messageToSend,
    securityCode,
    attestationCode,
    appSignature,
    language,
    logger,
    sequelizeLogger,
    onlyUseProvider,
  }: SendSmsRequest): Promise<AttestationModel> {
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
        ? this.smsProvidersFor(countryCode, phoneNumber, logger)
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
          providers: this.providersToCsv(providers),
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
            .labels(countryCode, PhoneNumberType[numberType])
            .inc()
        }

        // Parsed number and found providers. Attempt delivery.
        shouldRetry = await this.doSendSms(attestation, providers, logger)
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
      attestation = await this.findAttestationAndSendSms(key, logger, sequelizeLogger)
    }

    return attestation
  }

  // Force an existing attestation (could have received a delivery status or not) to be rerequested
  // immediately if there are sufficient attempts remaining.
  async rerequestAttestation({
    key,
    appSignature,
    language,
    securityCodePrefix,
    logger,
    sequelizeLogger,
  }: RerequestAttestationRequest): Promise<AttestationModel> {
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
        if (completedAgo >= this.allowRetryWithinCompletedMs) {
          Counters.attestationRequestsAlreadySent.inc()
          throw new ErrorWithResponse('Attestation can no longer be rerequested', 422)
        }
      }

      attestation.recordError(
        `Rerequested when status was ${AttestationStatus[attestation.status]}`
      )
      attestation.status = AttestationStatus.NotSent
      attestation.ongoingDeliveryId = null
      attestation.completedAt = null
      attestation.attempt += 1

      if (attestation.attempt >= this.maxDeliveryAttempts) {
        Counters.attestationRequestsAlreadySent.inc()
        throw new ErrorWithResponse('Delivery attempts exceeded', 422)
      }

      const providers = this.getProvidersFor(attestation, logger)
      shouldRetry = await this.doSendSms(attestation, providers, logger)

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
      attestation = await this.findAttestationAndSendSms(key, logger, sequelizeLogger)
    }

    return attestation
  }

  // Act on a delivery report for an SMS, scheduling a resend if last one failed.
  async receivedDeliveryReport(
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
          const providers = this.getProvidersFor(attestation, childLogger)
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

            if (attestation.attempt >= this.maxDeliveryAttempts) {
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
      setTimeout(() => this.findAttestationAndSendSms(key, childLogger, sequelizeLogger), timeout)
    }
  }

  smsProviderOfType(type: string): SmsProvider | undefined {
    return this.smsProviders.find((provider) => provider.type === type)
  }

  configuredSmsProviders(): string[] {
    return this.smsProviders.map((provider) => provider.type)
  }

  smsProvidersWithDeliveryStatus(): SmsProvider[] {
    return this.smsProviders.filter((provider) => provider.deliveryStatusMethod())
  }

  unsupportedRegionCodes(): string[] {
    return intersection(this.smsProviders.map((provider) => provider.unsupportedRegionCodes))
  }

  // Return all SMS providers for the given phone number, in order of preference for that region,
  // and not including any providers that has that region on its denylist.

  private smsProvidersFor(
    countryCode: string,
    phoneNumber: E164Number,
    logger: Logger
  ): SmsProvider[] {
    const providersForRegion = fetchEnvOrDefault(`SMS_PROVIDERS_${countryCode}`, '')
      .split(',')
      .filter((t) => t != null && t !== '')
    let providers =
      providersForRegion.length > 0
        ? providersForRegion.map((name) => this.smsProvidersByType[name])
        : // Use default list of providers, possibly shuffled (per-country provider lists are never shuffled)
        isYes(fetchEnvOrDefault('SMS_PROVIDERS_RANDOMIZED', '0'))
        ? shuffle(this.smsProviders)
        : this.smsProviders
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

  private providersToCsv(providers: SmsProvider[]) {
    return providers.map((provider) => provider.type).join(',')
  }

  // This list may be a strict subset of the valid providers (e.g. when forcing a provider for a test),
  // but cannot require providers not configured or unsupported for this country code.
  private getProvidersFor(attestation: AttestationModel, logger: Logger) {
    const validProviders = this.smsProvidersFor(
      attestation.countryCode,
      attestation.phoneNumber,
      logger
    )
    const attestationProviders = attestation.providers
      .split(',')
      .filter((t) => t != null && t !== '')
      .map((name) => this.smsProvidersByType[name])

    for (const p of attestationProviders) {
      if (!validProviders.find((v) => p.type === v.type)) {
        throw new Error(`Detected inconsistent provider configuration between instances`)
      }
    }
    return attestationProviders
  }

  private async findAttestationAndSendSms(
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

      const providers = this.getProvidersFor(attestation, logger)

      // Parsed number and found providers. Attempt delivery.
      shouldRetry = await this.doSendSms(attestation, providers, logger)

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
      attestation = await this.findAttestationAndSendSms(key, logger, sequelizeLogger)
    }

    return attestation
  }

  // Make first or next delivery attempt -- returns true if we should retry.
  private async doSendSms(
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
    } catch (error) {
      attestation.status = AttestationStatus.NotSent
      const errorMsg = `${error.message ?? error}`.slice(0, this.maxErrorLength)
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

      if (attestation.attempt >= this.maxDeliveryAttempts) {
        attestation.completedAt = new Date()
        logger.info('Final failure to send')
        Counters.attestationRequestsFailedToDeliverSms.inc()
        return false
      }

      return true
    }
  }
}
