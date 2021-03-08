import { sleep } from '@celo/base'
import { CeloTx } from '@celo/connect'
import { RemoteWallet } from '@celo/wallet-remote'
import WalletConnect, { CLIENT_EVENTS } from '@walletconnect/client'
import { ClientOptions, ClientTypes, PairingTypes, SessionTypes } from '@walletconnect/types'
import debugConfig from 'debug'
import { SupportedMethods } from './types'
import { WalletConnectSigner } from './wc-signer'

const debug = debugConfig('kit:wallet:wallet-connect-wallet')

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

  throw new Error('Unable to get pairing session, did you lose internet connection?')
}

const defaultInitOptions: ClientOptions = { relayProvider: 'wss://bridge.walletconnect.org' }
const defaultConnectOptions: ClientTypes.ConnectParams = {
  metadata: {
    name: 'ContractKit',
    description:
      "Celo's ContractKit is a library to help developers and validators to interact with the celo-blockchain.",
    url: 'https://github.com/celo-org/celo-monorepo/tree/master/packages/sdk/contractkit',
    icons: [],
  },
  permissions: {
    blockchain: {
      // alfajores, mainnet, baklava
      chains: ['celo:44787', 'celo:42220', 'celo:62320'],
    },
    jsonrpc: {
      methods: Object.values(SupportedMethods),
    },
  },
}

/**
 * Utility for making the API of this package nicer.
 *
 * We want to force passing metadata (name, description, etc), but not permissions,
 * which will likely remain static across dapps.
 */
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
type ConnectOptions = Optional<ClientTypes.ConnectParams, 'permissions'>

/*
 *   WARNING: This class should only be used with well-permissioned providers (ie IPC)
 *   to avoid sensitive user 'privateKey' and 'passphrase' information being exposed
 */
export class WalletConnectWallet extends RemoteWallet<WalletConnectSigner> {
  private initOptions: ClientOptions
  private connectOptions: ClientTypes.ConnectParams

  private client?: WalletConnect
  private pairing?: PairingTypes.Settled
  private pairingProposal?: PairingTypes.Proposal
  private session?: SessionTypes.Settled

  constructor({ init, connect }: { init?: ClientOptions; connect?: ConnectOptions }) {
    super()

    this.initOptions = { ...defaultInitOptions, ...init }
    this.connectOptions = { ...defaultConnectOptions, ...connect }
  }

  /**
   * Pulled out to allow mocking
   */
  private getWalletConnectClient() {
    return WalletConnect.init(this.initOptions)
  }

  /**
   * Get the URI needed for out of band session establishment
   */
  public async getUri() {
    this.client = await this.getWalletConnectClient()

    this.client.on(CLIENT_EVENTS.session.proposal, this.onSessionProposal)
    this.client.on(CLIENT_EVENTS.session.created, this.onSessionCreated)
    this.client.on(CLIENT_EVENTS.session.updated, this.onSessionUpdated)
    this.client.on(CLIENT_EVENTS.session.deleted, this.onSessionDeleted)

    this.client.on(CLIENT_EVENTS.pairing.proposal, this.onPairingProposal)
    this.client.on(CLIENT_EVENTS.pairing.created, this.onPairingCreated)
    this.client.on(CLIENT_EVENTS.pairing.updated, this.onPairingUpdated)
    this.client.on(CLIENT_EVENTS.pairing.deleted, this.onPairingDeleted)

    // tslint:disable-next-line
    this.client.connect(this.connectOptions)

    await waitForTruthy(() => this.pairingProposal)

    return this.pairingProposal!.signal.params.uri
  }

  onSessionProposal = (sessionProposal: SessionTypes.Proposal) => {
    debug('onSessionProposal', sessionProposal)
  }
  onSessionCreated = (session: SessionTypes.Created) => {
    this.session = session
  }
  onSessionUpdated = (session: SessionTypes.Update) => {
    debug('onSessionUpdated', session)
  }
  onSessionDeleted = () => {
    this.session = undefined
  }

  onPairingProposal = (pairingProposal: PairingTypes.Proposal) => {
    this.pairingProposal = pairingProposal
  }
  onPairingCreated = (pairing: PairingTypes.Created) => {
    this.pairing = pairing
  }
  onPairingUpdated = (pairing: PairingTypes.Update) => {
    if (!this.pairing) {
      debug('Attempted to update non existant pairing', pairing)
      return
    }
    this.pairing.peer.metadata = pairing.peer.metadata
  }
  onPairingDeleted = () => {
    this.pairing = undefined
  }

  async loadAccountSigners(): Promise<Map<string, WalletConnectSigner>> {
    /**
     * Session establishment happens out of band so after somehow
     * communicating the connection URI (often via QR code) we can
     * continue with the setup process
     */
    await waitForTruthy(() => this.session)

    const addressToSigner = new Map<string, WalletConnectSigner>()
    this.session!.state.accounts.forEach((fullyQualifiedAccount) => {
      // 0x123@celo:1234 = <address>@<chain>:<network_id>
      const [address, , networkId] = fullyQualifiedAccount.split(/[@:]/)

      const signer = new WalletConnectSigner(this.client!, this.session!, address, networkId)
      addressToSigner.set(address, signer)
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

  close = async () => {
    if (!this.client) {
      throw new Error('Wallet must be initialized before calling close()')
    }

    if (this.session) {
      await this.client.disconnect({ topic: this.session.topic, reason: 'Session closed' })
    }

    await this.client.pairing.delete({ topic: this.pairing!.topic, reason: 'Session closed' })
  }
}
