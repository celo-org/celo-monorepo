import { BlsBlindingClient } from '@celo/contractkit/lib/identity/odis/bls-blinding-client'
import BlindThresholdBls from 'react-native-blind-threshold-bls'

/**
 * Wraps the React Native BLS client
 */
export class ReactBlsBlindingClient implements BlsBlindingClient {
  private odisPubKey: string

  constructor(odisPubKey: string) {
    this.odisPubKey = odisPubKey
  }

  async blindMessage(base64PhoneNumber: string): Promise<string> {
    return (await BlindThresholdBls.blindMessage(base64PhoneNumber)).trim()
  }

  unblindAndVerifyMessage(base64BlindSig: string): Promise<string> {
    return BlindThresholdBls.unblindMessage(base64BlindSig, this.odisPubKey)
  }
}
