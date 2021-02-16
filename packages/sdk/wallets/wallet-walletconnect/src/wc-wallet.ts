import { sleep } from '@celo/base'
import { CeloTx } from '@celo/connect'
import { RemoteWallet } from '@celo/wallet-remote'
import WalletConnect, { CLIENT_EVENTS } from '@walletconnect/client'
import { ClientOptions, PairingTypes, SessionTypes } from '@walletconnect/types'
import { SupportedMethods } from './types'
import { WalletConnectSigner } from './wc-signer'

/**
 * Session establishment happens out of band so after somehow
 * communicating the connection URI (often via QR code) we can
 * continue with the setup process
 */
async function waitForTruthy(getValue: () => any, attempts: number = 10) {
  let waitDuration = 500
  for (let i = 0; i < attempts; i++) {
    if (getValue()) {
      return
    }

    await sleep(waitDuration)
    waitDuration = waitDuration * 1.5
  }

  throw new Error('Unable to get paing session, did you lose internet connection?')
}

/*
 *   WARNING: This class should only be used with well-permissioned providers (ie IPC)
 *   to avoid sensitive user 'privateKey' and 'passphrase' information being exposed
 */
export class WalletConnectWallet extends RemoteWallet<WalletConnectSigner> {
  private options: ClientOptions
  private metadata: SessionTypes.Metadata

  private client?: WalletConnect
  private pairing?: PairingTypes.Proposal
  private session?: SessionTypes.Settled

  constructor({ options, metadata }: { options?: ClientOptions; metadata: SessionTypes.Metadata }) {
    super()

    this.options = { relayProvider: 'wss://staging.walletconnect.org', ...options }
    this.metadata = metadata

    this.setupClient()
  }

  /**
   * Get the URI needed for out of band session establishment
   */
  public async getUri() {
    await waitForTruthy(() => this.pairing)
    return this.pairing!.signal.params.uri
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

  private async setupClient() {
    this.client = await WalletConnect.init(this.options)

    this.client.on(CLIENT_EVENTS.session.proposal, this.onSessionProposal)
    this.client.on(CLIENT_EVENTS.session.created, this.onSessionCreated)
    this.client.on(CLIENT_EVENTS.session.updated, this.onSessionUpdated)
    this.client.on(CLIENT_EVENTS.session.deleted, this.onSessionDeleted)

    this.client.on(CLIENT_EVENTS.pairing.proposal, this.onPairingProposal)
    this.client.on(CLIENT_EVENTS.pairing.created, this.onPairingCreated)
    this.client.on(CLIENT_EVENTS.pairing.updated, this.onPairingUpdated)
    this.client.on(CLIENT_EVENTS.pairing.deleted, this.onPairingDeleted)

    // @ts-ignore no-dangling-promise
    this.client
      .connect({
        metadata: this.metadata,
        permissions: {
          blockchain: {
            // alfajores, mainnet, baklava
            chains: ['celo:44787', 'celo:42220', 'celo:62320'],
          },
          jsonrpc: {
            methods: Object.values(SupportedMethods),
          },
        },
      })
      .then((session) => (this.session = session))
  }

  async loadAccountSigners(): Promise<Map<string, WalletConnectSigner>> {
    /**
     * Session establishment happens out of band so after somehow
     * communicating the connection URI (often via QR code) we can
     * continue with the setup process
     */
    await waitForTruthy(() => this.session)

    const addressToSigner = new Map<string, WalletConnectSigner>()
    this.session!.state.accounts.forEach((accountWithChain) => {
      const [account] = accountWithChain.split('@')
      const signer = new WalletConnectSigner(this.client!, this.session!, account)
      addressToSigner.set(account, signer)
    })

    return addressToSigner
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
    if (!this.client || !this.session) {
      throw new Error('Wallet must be initialized before calling close()')
    }

    return this.client.disconnect({ topic: this.session.topic, reason: 'Session closed' })
  }
}
