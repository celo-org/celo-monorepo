import { newKit } from '@celo/contractkit'
import WalletConnect, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'

const privateKey = '04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976'
const kit = newKit('https://alfajores-forno.celo-testnet.org')
kit.addAccount(privateKey)
const wallet = kit.getWallet()!
const [account] = wallet.getAccounts()

enum Methods {
  accounts = 'eth_accounts',
  sendTransaction = 'eth_sendTransaction',
  signTransaction = 'eth_signTransaction',
  sign = 'eth_sign',
  personalSign = 'personal_sign',
  signTypedData = 'eth_signTypedData',
}

function parsePersonalSign(req: SessionTypes.PayloadEvent): { from: string; payload: string } {
  // @ts-ignore
  const [payload, from] = req.payload.params
  return { from, payload }
}

export async function initialiseTestWallet(uri: string) {
  function onSessionProposal(proposal: SessionTypes.Proposal) {
    console.log('WalletConnect proposal', proposal)
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
    client.approve({ proposal, response })
  }
  function onSessionCreated(session: SessionTypes.Created) {
    console.log('onSessionCreated', session)
  }
  function onSessionUpdated(session: SessionTypes.Update) {
    console.log('onSessionUpdated', session)
  }
  function onSessionDeleted(session: SessionTypes.DeleteParams) {
    console.log('onSessionDeleted', session)
  }

  function onPairingProposal(pairing: PairingTypes.Proposal) {
    console.log('onPairingProposal', pairing)
  }
  function onPairingCreated(pairing: PairingTypes.Created) {
    console.log('onPairingCreated', pairing)
  }
  function onPairingUpdated(pairing: PairingTypes.Update) {
    console.log('onPairingUpdated', pairing)
  }
  function onPairingDeleted(pairing: PairingTypes.DeleteParams) {
    console.log('onPairingDeleted', pairing)
  }

  async function onSessionPayload(event: SessionTypes.PayloadEvent) {
    const {
      topic,
      // @ts-ignore todo: ask Pedro why this isn't typed
      payload: { id, method },
    } = event

    if (method === Methods.personalSign) {
      const { payload, from } = parsePersonalSign(event)
      const signature = await wallet.signPersonalMessage(from, payload)
      client.respond({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          result: signature,
        },
      })
      return
    }
  }

  const client = await WalletConnect.init({
    relayProvider: 'wss://staging.walletconnect.org',
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
}
