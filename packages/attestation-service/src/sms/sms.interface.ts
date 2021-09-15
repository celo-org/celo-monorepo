import Logger from 'bunyan'
import { AttestationModel, AttestationStatus } from '../models/attestation'
import { SmsProvider } from './provider/smsProvider'
import { SmsProviderType } from './provider/smsProvider.enum'
import { RerequestAttestationRequest } from './requests/rerequestAttestation.request'
import { SendSmsRequest } from './requests/sendSms.request'

export interface ISmsService {
  initializeSmsProviders(deliveryStatusURLForProviderType: (type: string) => string): Promise<void>

  startSendSms(smsRequest: SendSmsRequest): Promise<AttestationModel>
  rerequestAttestation(
    rerequestAttestationRequest: RerequestAttestationRequest
  ): Promise<AttestationModel>

  receivedDeliveryReport(
    deliveryId: string,
    deliveryStatus: AttestationStatus,
    errorCode: string | null,
    logger: Logger
  ): Promise<void>

  smsProviderOfType(type: SmsProviderType): SmsProvider | undefined
  configuredSmsProviders(): string[]
  smsProvidersWithDeliveryStatus(): SmsProvider[]
  unsupportedRegionCodes(): string[]
}
