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

  async request(event: SessionTypes.PayloadEvent) {
    const {
      // @ts-ignore
      request: { method },
    } = event

    // the request gets transformed between the client
    // and wallet, here we reassign to use our decoding
    //  methods in ./common.ts.
    // @ts-ignore
    const request = { payload: { params: event.request.params } }

    let result = null
    if (method === SupportedMethods.personalSign) {
      const { payload, from } = parsePersonalSign(request)
      result = await testWallet.signPersonalMessage(from, payload)
    } else if (method === SupportedMethods.signTypedData) {
      const { from, payload } = parseSignTypedData(request)
      result = await testWallet.signTypedData(from, payload)
    } else if (method === SupportedMethods.signTransaction) {
      const tx = parseSignTransaction(request)
      result = await testWallet.signTransaction(tx)
    } else if (method === SupportedMethods.computeSharedSecret) {
      const { from, publicKey } = parseComputeSharedSecret(request)
      result = (await testWallet.computeSharedSecret(from, publicKey)).toString('hex')
    } else if (method === SupportedMethods.decrypt) {
      const { from, payload } = parseDecrypt(request)
      result = (await testWallet.decrypt(from, payload)).toString('hex')
    } else {
      return
    }

    return result
  }

  // tslint:disable-next-line
  disconnect() {}
}
