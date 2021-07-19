import bodyParser from 'body-parser'
import Logger from 'bunyan'
import express from 'express'
import twilio, { Twilio } from 'twilio'
import { fetchEnv, fetchEnvOrDefault } from '../env'
import { AttestationModel, AttestationStatus } from '../models/attestation'
import { readUnsupportedRegionsFromEnv, SmsProvider, SmsProviderType } from './base'
import { receivedDeliveryReport } from './index'

export class TwilioSmsProvider extends SmsProvider {
  static fromEnv() {
    return new TwilioSmsProvider(
      fetchEnv('TWILIO_ACCOUNT_SID'),
      fetchEnv('TWILIO_MESSAGING_SERVICE_SID'),
      fetchEnvOrDefault('TWILIO_VERIFY_SERVICE_SID', ''),
      fetchEnv('TWILIO_AUTH_TOKEN'),
      readUnsupportedRegionsFromEnv('TWILIO_UNSUPPORTED_REGIONS', 'TWILIO_BLACKLIST')
    )
  }

  client: Twilio
  messagingServiceSid: string
  verifyServiceSid: string
  type = SmsProviderType.TWILIO
  deliveryStatusURL: string | undefined
  // https://www.twilio.com/docs/verify/api/verification#start-new-verification
  twilioSupportedLocales = [
    'af',
    'ar',
    'ca',
    'cs',
    'da',
    'de',
    'el',
    'en',
    'en-gb',
    'es',
    'fi',
    'fr',
    'he',
    'hi',
    'hr',
    'hu',
    'id',
    'it',
    'ja',
    'ko',
    'ms',
    'nb',
    'nl',
    'pl',
    'pt',
    'pr-br',
    'ro',
    'ru',
    'sv',
    'th',
    'tl',
    'tr',
    'vi',
    'zh',
    'zh-cn',
    'zh-hk',
  ]

  constructor(
    twilioSid: string,
    messagingServiceSid: string,
    verifyServiceSid: string,
    twilioAuthToken: string,
    unsupportedRegionCodes: string[]
  ) {
    super()
    this.client = twilio(twilioSid, twilioAuthToken)
    this.messagingServiceSid = messagingServiceSid
    this.verifyServiceSid = verifyServiceSid
    this.unsupportedRegionCodes = unsupportedRegionCodes
  }

  async receiveDeliveryStatusReport(req: express.Request, logger: Logger) {
    await receivedDeliveryReport(
      req.body.MessageSid,
      this.deliveryStatus(req.body.MessageStatus),
      req.body.ErrorCode,
      logger
    )
  }

  deliveryStatus(messageStatus: string | null): AttestationStatus {
    switch (messageStatus) {
      case 'delivered':
        return AttestationStatus.Delivered
      case 'failed':
        return AttestationStatus.Failed
      case 'undelivered':
        return AttestationStatus.Failed
      case 'sent':
        return AttestationStatus.Upstream
      case 'queued':
        return AttestationStatus.Queued
    }
    return AttestationStatus.Other
  }

  deliveryStatusMethod = () => 'POST'

  deliveryStatusHandlers() {
    return [
      bodyParser.urlencoded({ extended: false }),
      twilio.webhook({ url: this.deliveryStatusURL! }),
    ]
  }

  async initialize(deliveryStatusURL: string) {
    // Ensure the messaging service exists
    try {
      await this.client.messaging.services.get(this.messagingServiceSid).fetch()
      this.deliveryStatusURL = deliveryStatusURL
    } catch (error) {
      throw new Error(`Twilio Messaging Service could not be fetched: ${error}`)
    }
    if (this.verifyServiceSid) {
      try {
        await this.client.verify.services
          .get(this.verifyServiceSid)
          .fetch()
          .then((service) => {
            if (!service.customCodeEnabled) {
              // Make sure that custom code is enabled
              throw new Error(
                'TWILIO_VERIFY_SERVICE_SID is specified, but customCode is not enabled. Please contact Twilio support to enable it.'
              )
            }
          })
      } catch (error) {
        throw new Error(`Twilio Verify Service could not be fetched: ${error}`)
      }
    }
  }

  async sendSms(attestation: AttestationModel) {
    // Prefer Verify API if Verify Service is present
    if (this.verifyServiceSid) {
      const requestParams: any = {
        to: attestation.phoneNumber,
        channel: 'sms',
        customCode: attestation.securityCode,
      }

      // This param tells Twilio to add the <#> prefix and app hash postfix
      if (attestation.appSignature) {
        requestParams.appHash = attestation.appSignature
      }
      // Normalize to locales that Twilio supports
      // If locale is not supported, Twilio API will throw an error
      if (attestation.language) {
        const locale = attestation.language.toLocaleLowerCase()
        if (['es-419', 'es-us', 'es-la'].includes(locale)) {
          attestation.language = 'es'
        }
        if (this.twilioSupportedLocales.includes(locale)) {
          requestParams.locale = locale
        }
      }
      try {
        const m = await this.client.verify
          .services(this.verifyServiceSid)
          .verifications.create(requestParams)
        return m.sid
      } catch (e) {
        // Verify landlines using voice
        if (e.message.includes('SMS is not supported by landline phone number')) {
          requestParams.appHash = undefined
          requestParams.channel = 'call'
          const m = await this.client.verify
            .services(this.verifyServiceSid)
            .verifications.create(requestParams)
          return m.sid
        } else {
          throw e
        }
      }
    } else {
      // Send using the message service
      const m = await this.client.messages.create({
        body: attestation.message,
        to: attestation.phoneNumber,
        from: this.messagingServiceSid,
        statusCallback: this.deliveryStatusURL,
      })
      return m.sid
    }
  }
}
