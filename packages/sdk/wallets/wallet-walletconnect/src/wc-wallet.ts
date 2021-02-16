import { sleep } from '@celo/base'
import { CeloTx } from '@celo/connect'
import { RemoteWallet } from '@celo/wallet-remote'
import WalletConnect, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { SupportedMethods } from './types'
import { WalletConnectSigner } from './wc-signer'

/*
 *   WARNING: This class should only be used with well-permissioned providers (ie IPC)
 *   to avoid sensitive user 'privateKey' and 'passphrase' information being exposed
 */
export class WalletConnectWallet extends RemoteWallet<WalletConnectSigner> {
  private metadata: any

  private client?: WalletConnect
  private pairing?: PairingTypes.Proposal

  constructor(metadata: any) {
    super()

    this.metadata = metadata
  }

  /**
   *
   */
  getUri = async () => {
    for (let i = 0; i < 5; i++) {
      if (this.pairing?.signal?.params?.uri) {
        return this.pairing.signal.params.uri
      }

      await sleep(1000)
    }

    throw new Error('Unable to get URI, did the session connect?')
  }

  onSessionProposal = (proposal: SessionTypes.Proposal) => {
    console.log('onSessionProposal', proposal)
  }
  onSessionCreated = (session: SessionTypes.Created) => {
    console.log('onSessionCreated', session)
  }
  onSessionUpdated = (session: SessionTypes.Update) => {
    console.log('onSessionUpdated', session)
  }
  onSessionDeleted = (session: SessionTypes.DeleteParams) => {
    console.log('onSessionDeleted', session)
  }

  onPairingProposal = (pairing: PairingTypes.Proposal) => {
    console.log('onPairingProposal', pairing)
    this.pairing = pairing
  }
  onPairingCreated = (pairing: PairingTypes.Created) => {
    console.log('onPairingCreated', pairing)
  }
  onPairingUpdated = (pairing: PairingTypes.Update) => {
    console.log('onPairingUpdated', pairing)
  }
  onPairingDeleted = (pairing: PairingTypes.DeleteParams) => {
    console.log('onPairingDeleted', pairing)
  }

  async loadAccountSigners(): Promise<Map<string, WalletConnectSigner>> {
    const addressToSigner = new Map<string, WalletConnectSigner>()

    const client = await WalletConnect.init({
      relayProvider: 'wss://staging.walletconnect.org',
    })
    this.client = client

    client.on(CLIENT_EVENTS.session.proposal, this.onSessionProposal)
    client.on(CLIENT_EVENTS.session.created, this.onSessionCreated)
    client.on(CLIENT_EVENTS.session.updated, this.onSessionUpdated)
    client.on(CLIENT_EVENTS.session.deleted, this.onSessionDeleted)

    client.on(CLIENT_EVENTS.pairing.proposal, this.onPairingProposal)
    client.on(CLIENT_EVENTS.pairing.created, this.onPairingCreated)
    client.on(CLIENT_EVENTS.pairing.updated, this.onPairingUpdated)
    client.on(CLIENT_EVENTS.pairing.deleted, this.onPairingDeleted)

    return new Promise(async (resolve) => {
      const session = await client.connect({
        metadata: this.metadata,
        permissions: {
          blockchain: {
            chains: ['celo:44787'],
          },
          jsonrpc: {
            methods: Object.values(SupportedMethods),
          },
        },
      })

      session.state.accounts.forEach((accountWithChain) => {
        const [account] = accountWithChain.split('@')
        const signer = new WalletConnectSigner(client, session, account)
        addressToSigner.set(account, signer)
      })

      resolve(addressToSigner)
    })
  }

  /**
   * Gets the signer based on the 'from' field in the tx body
   * @param txParams Transaction to sign
   * @dev overrides WalletBase.signTransaction
   */
  async signTransaction(txParams: CeloTx) {
    const fromAddress = txParams.from!.toString()
    const signer = this.getSigner(fromAddress)
    return signer.signRawTransaction(txParams)
  }

  close = () => {
    if (!this.client || !this.pairing) {
      throw new Error('Wallet must be initialized before calling close()')
    }
    this.client.disconnect({ topic: this.pairing.topic, reason: 'Pairing closed' })
  }
}
