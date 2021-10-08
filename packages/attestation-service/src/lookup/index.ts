import { SignatureUtils, VerifiableCredentialUtils } from '@celo/utils'
import Logger from 'bunyan'
import { shuffle } from 'lodash'
import { useKit } from '../db'
import { fetchEnv, fetchEnvOrDefault, getAttestationSignerAddress, isYes } from '../env'
import { Counters } from '../metrics'
import { AttestationModel } from '../models/attestation'
import { obfuscateNumber } from '../utils/phone_number'
import { LookupProvider, LookupProviderType } from './base'
import { TwilioLookupProvider } from './twilio'
import { VonageLookupProvider } from './vonage'

const lookupProviders: LookupProvider[] = []
const lookupProvidersByType: any = {}

export async function initializeLookupProviders() {
  const lookupProvidersToConfigure = fetchEnv('LOOKUP_PROVIDERS')
    .split(',')
    .filter((t) => t != null && t !== '') as Array<LookupProviderType | string>

  if (lookupProvidersToConfigure.length === 0) {
    throw new Error('You have to specify at least one lookup provider')
  }

  for (const configuredLookupProvider of lookupProvidersToConfigure) {
    if (lookupProvidersByType[configuredLookupProvider]) {
      throw new Error(
        `Providers in LOOKUP_PROVIDERS must be unique: dupe: ${configuredLookupProvider}`
      )
    }
    switch (configuredLookupProvider) {
      case LookupProviderType.VONAGE:
        const vonageProvider = VonageLookupProvider.fromEnv()
        lookupProviders.push(vonageProvider)
        lookupProvidersByType[LookupProviderType.VONAGE] = vonageProvider
        break
      case LookupProviderType.TWILIO:
        const twilioProvider = TwilioLookupProvider.fromEnv()
        lookupProviders.push(twilioProvider)
        lookupProvidersByType[LookupProviderType.TWILIO] = twilioProvider
        break
      default:
        throw new Error(`Unknown lookup provider type specified: ${configuredLookupProvider}`)
    }
  }
}

function getLookupProviders(): LookupProvider[] {
  return isYes(fetchEnvOrDefault('LOOKUP_PROVIDERS_RANDOMIZED', '0'))
    ? shuffle(lookupProviders)
    : lookupProviders
}

export function lookupProviderOfType(type: string) {
  return lookupProviders.find((provider) => provider.type === type)
}

export function configuredLookupProviders() {
  return lookupProviders.map((provider) => provider.type)
}

export const issueAttestationPhoneNumberTypeCredential = async (
  attestation: AttestationModel,
  logger: Logger
) => {
  try {
    const phoneNumberTypeProvider = await lookupPhoneNumber(attestation, logger)
    const attestationSignerAddress = getAttestationSignerAddress().toLowerCase()

    const credential = VerifiableCredentialUtils.getPhoneNumberTypeJSONLD(
      attestation.phoneNumberType, // TODO(Alec): does setting this value in lookupPhoneNumber actually work?
      attestation.account.toLowerCase(),
      attestationSignerAddress,
      attestation.identifier,
      phoneNumberTypeProvider
    )

    const proofOptions = VerifiableCredentialUtils.getProofOptions(attestationSignerAddress)

    return await VerifiableCredentialUtils.issueCredential(
      credential,
      proofOptions,
      async (signInput) =>
        useKit(async (kit) =>
          SignatureUtils.serializeSignature(
            await kit.connection.signTypedData(attestationSignerAddress, signInput)
          )
        )
    )
  } catch (e) {
    throw new Error(e)
  }
}

// Lookup phone number
async function lookupPhoneNumber(
  attestation: AttestationModel,
  logger: Logger
): Promise<LookupProviderType> {
  const providers = getLookupProviders()
  const provider = providers[attestation.attempt % providers.length]
  try {
    logger.info(
      {
        provider: provider.type,
        obfuscatedPhoneNumber: obfuscateNumber(attestation.phoneNumber),
      },
      'Lookup phoneNumber'
    )

    const { countryCode, phoneNumberType } = await provider.lookup(attestation.phoneNumber)

    Counters.attestationRequestsByNumberType.labels(countryCode, phoneNumberType).inc()

    attestation.phoneNumberType = phoneNumberType
  } catch (error) {
    const errorMsg = `${error.message ?? error}`
    attestation.recordError(errorMsg)

    logger.info(
      {
        provider: provider.type,
        attempt: attestation.attempt, // TODO(Alec): Shouldn't we increment attempt here?
        error: errorMsg,
      },
      'Phone number lookup failed'
    )
  }
  return provider.type
}
