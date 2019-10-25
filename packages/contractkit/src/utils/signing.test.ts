import {
  parseSignature,
  serializeSignature,
  signMessage,
  signMessageNatively,
} from '@celo/utils/lib/signatureUtils'
import { testWithGanache } from '../test-utils/ganache-test'
import { ACCOUNT_PRIVATE_KEYS } from '../test-utils/ganache.setup'

// This only really tests signatureUtils in @celo/utils, but is tested here
// to avoid the web3/ganache setup in @celo/utils
testWithGanache('Signing', (web3) => {
  it('signs a message the same way natively and with an explicit private key', async () => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
    const message = 'message'
    const nativeSignature = await signMessageNatively(message, account, web3.eth.sign)
    parseSignature(message, serializeSignature(nativeSignature), account)

    const simulatedSignature = await signMessage(message, ACCOUNT_PRIVATE_KEYS[0], account)
    parseSignature(message, serializeSignature(simulatedSignature), account)

    expect(nativeSignature).toEqual(simulatedSignature)
  })

  it('signs a message that was hashed the same way natively and with an explicit private key', async () => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
    const message = web3.utils.soliditySha3('message')
    const nativeSignature = await signMessageNatively(message, account, web3.eth.sign)
    parseSignature(message, serializeSignature(nativeSignature), account)

    const simulatedSignature = await signMessage(message, ACCOUNT_PRIVATE_KEYS[0], account)
    parseSignature(message, serializeSignature(simulatedSignature), account)

    expect(nativeSignature).toEqual(simulatedSignature)
  })
})
