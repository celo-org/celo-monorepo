import { CLIENT_EVENTS } from '@walletconnect/client'
import { SessionTypes } from '@walletconnect/types'
import { EventEmitter } from 'events'
import { SupportedMethods } from '../types'
import {
  parseComputeSharedSecret,
  parseDecrypt,
  parsePersonalSign,
  parseSignTransaction,
  parseSignTypedData,
  testAddress,
  testWallet,
} from './common'

const pairingTopic = 'XXX'

export class MockWalletConnectClient extends EventEmitter {
  // tslint:disable-next-line
  init() {}

  async connect() {
    this.emit(CLIENT_EVENTS.pairing.proposal, {
      signal: {
        params: {
          uri: 'mockURI',
        },
      },
    })
    this.emit(CLIENT_EVENTS.pairing.created, {
      topic: pairingTopic,
      peer: {
        metadata: {},
        // tslint:disable-next-line
        delete: () => {},
      },
    })
    this.emit(CLIENT_EVENTS.session.created, {
      topic: pairingTopic,
      state: {
        accounts: [`${testAddress}@celo:44787`],
      },
    })
  }

  async request(event: SessionTypes.RequestEvent) {
    const {
      request: { method, params },
    } = event

    // the request gets transformed between the client
    // and wallet, here we reassign to use our decoding
    //  methods in ./common.ts.
    let result = null
    if (method === SupportedMethods.personalSign) {
      const { payload, from } = parsePersonalSign(params)
      result = await testWallet.signPersonalMessage(from, payload)
    } else if (method === SupportedMethods.signTypedData) {
      const { from, payload } = parseSignTypedData(params)
      result = await testWallet.signTypedData(from, payload)
    } else if (method === SupportedMethods.signTransaction) {
      const tx = parseSignTransaction(params)
      result = await testWallet.signTransaction(tx)
    } else if (method === SupportedMethods.computeSharedSecret) {
      const { from, publicKey } = parseComputeSharedSecret(params)
      result = (await testWallet.computeSharedSecret(from, publicKey)).toString('hex')
    } else if (method === SupportedMethods.decrypt) {
      const { from, payload } = parseDecrypt(params)
      result = (await testWallet.decrypt(from, payload)).toString('hex')
    } else {
      return
    }

    return result
  }

  // tslint:disable-next-line
  disconnect() {}
}
