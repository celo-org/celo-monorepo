import { newKit } from '@celo/contractkit'
import { toChecksumAddress } from '@celo/utils/lib/address'
import WalletConnect, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import debugConfig from 'debug'
import { SupportedMethods } from '../types'
import {
  parseComputeSharedSecret,
  parseDecrypt,
  parsePersonalSign,
  parseSignTransaction,
  parseSignTypedData,
} from './common'

const debug = debugConfig('in-memory-wallet')

const privateKey = '04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976'
const kit = newKit('https://alfajores-forno.celo-testnet.org')
kit.addAccount(privateKey)
const wallet = kit.getWallet()!
const [account] = wallet.getAccounts()

export const testPrivateKey = privateKey
export const testAddress = toChecksumAddress(account)

export function getTestWallet() {
  let client: WalletConnect
  let sessionTopic: string
  let pairingTopic: string

  const onSessionProposal = (proposal: SessionTypes.Proposal) => {
    const response: SessionTypes.Response = {
      metadata: {
        name: 'Wallet',
        description: 'A mobile payments wallet that works worldwide',
        url: 'https://wallet.com',
        icons: ['https://wallet.com/favicon.ico'],
      },
      state: {
        accounts: [`${account}@celo:44787`],
      },
    }
    return client.approve({ proposal, response })
  }
  const onSessionCreated = (session: SessionTypes.Created) => {
    sessionTopic = session.topic
  }
  const onSessionUpdated = (session: SessionTypes.Update) => {
    debug('onSessionUpdated', session)
  }
  const onSessionDeleted = (session: SessionTypes.DeleteParams) => {
    debug('onSessionDeleted', session)
  }

  const onPairingProposal = (pairing: PairingTypes.Proposal) => {
    debug('onPairingProposal', pairing)
  }
  const onPairingCreated = (pairing: PairingTypes.Created) => {
    pairingTopic = pairing.topic
  }
  const onPairingUpdated = (pairing: PairingTypes.Update) => {
    debug('onPairingUpdated', pairing)
  }
  const onPairingDeleted = (pairing: PairingTypes.DeleteParams) => {
    debug('onPairingDeleted', pairing)
  }

  async function onSessionPayload(event: SessionTypes.PayloadEvent) {
    const {
      topic,
      // @ts-ignore todo: ask Pedro why this isn't typed
      payload: { id, method },
    } = event

    let result: any

    if (method === SupportedMethods.personalSign) {
      const { payload, from } = parsePersonalSign(event)
      result = await wallet.signPersonalMessage(from, payload)
    } else if (method === SupportedMethods.signTypedData) {
      const { from, payload } = parseSignTypedData(event)
      result = await wallet.signTypedData(from, payload)
    } else if (method === SupportedMethods.signTransaction) {
      const tx = parseSignTransaction(event)
      result = await wallet.signTransaction(tx)
    } else if (method === SupportedMethods.computeSharedSecret) {
      const { from, publicKey } = parseComputeSharedSecret(event)
      result = (await wallet.computeSharedSecret(from, publicKey)).toString('hex')
    } else if (method === SupportedMethods.decrypt) {
      const { from, payload } = parseDecrypt(event)
      result = (await wallet.decrypt(from, payload)).toString('hex')
    } else {
      // client.reject({})
      // in memory wallet should always approve actions
      debug('unknown method', method)
      return
    }

    return client.respond({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result,
      },
    })
  }

  return {
    init: async (uri: string) => {
      client = await WalletConnect.init({
        relayProvider: process.env.WALLET_CONNECT_BRIGDE,
      })
      client.on(CLIENT_EVENTS.session.proposal, onSessionProposal)
      client.on(CLIENT_EVENTS.session.created, onSessionCreated)
      client.on(CLIENT_EVENTS.session.updated, onSessionUpdated)
      client.on(CLIENT_EVENTS.session.deleted, onSessionDeleted)
      client.on(CLIENT_EVENTS.session.payload, onSessionPayload)

      client.on(CLIENT_EVENTS.pairing.proposal, onPairingProposal)
      client.on(CLIENT_EVENTS.pairing.created, onPairingCreated)
      client.on(CLIENT_EVENTS.pairing.updated, onPairingUpdated)
      client.on(CLIENT_EVENTS.pairing.deleted, onPairingDeleted)

      await client.pair({ uri })
    },
    async close() {
      await client.disconnect({ reason: 'End of session', topic: sessionTopic })
      await client.pairing.delete({ topic: pairingTopic, reason: 'End of session' })
    },
  }
}
