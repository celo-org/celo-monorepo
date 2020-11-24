import RNGoogleSafetyNet from 'react-native-google-safetynet'
import { SAFETYNET_KEY } from 'src/config'
import Logger from 'src/utils/Logger'

const NONCE_LENGTH = 32

export const getSafetyNetAttestation = async () => {
  try {
    if (!(await RNGoogleSafetyNet.isPlayServicesAvailable())) {
      return {}
    }
    const nonce = await RNGoogleSafetyNet.generateNonce(NONCE_LENGTH)
    return RNGoogleSafetyNet.sendAttestationRequest(nonce, SAFETYNET_KEY)
  } catch (error) {
    Logger.error('Error requesting SafetyNet attestation', error)
    return {}
  }
}
