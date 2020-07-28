import { BlsBlindingClient } from '@celo/contractkit'
import BlindThresholdBls from 'react-native-blind-threshold-bls'

export class ReactBlsBlindingClient implements BlsBlindingClient {
  private pgpnpPubKey: string

  constructor(pgpnpPubKey: string) {
    this.pgpnpPubKey = pgpnpPubKey
  }

  async blindMessage(base64PhoneNumber: string): Promise<string> {
    return (await BlindThresholdBls.blindMessage(base64PhoneNumber)).trim()
  }

  async unblindAndVerifyMessage(base64BlindSig: string): Promise<string> {
    return BlindThresholdBls.unblindMessage(base64BlindSig, this.pgpnpPubKey)
  }
}
