import { LocalSigner, NativeSigner, parseSignature } from '@celo/utils/lib/signatureUtils'
import { testWithGanache } from '../test-utils/ganache-test'
import { ACCOUNT_ADDRESSES, ACCOUNT_PRIVATE_KEYS } from '../test-utils/ganache.setup'

// This only really tests signatureUtils in @celo/utils, but is tested here
// to avoid the web3/ganache setup in @celo/utils
testWithGanache('Signing', (web3) => {
  const account = ACCOUNT_ADDRESSES[0]
  const pKey = ACCOUNT_PRIVATE_KEYS[0]

  const nativeSigner = NativeSigner(web3.eth.sign, account)
  const localSigner = LocalSigner(pKey)

  it('signs a message the same way via RPC and with an explicit private key', async () => {
    const message = 'message'
    const nativeSignature = await nativeSigner.sign(message)
    parseSignature(message, nativeSignature, account)

    const localSignature = await localSigner.sign(message)
    parseSignature(message, localSignature, account)

    expect(nativeSignature).toEqual(localSignature)
  })

  it('signs a message that was hashed the same way via RPC and with an explicit private key', async () => {
    // This test checks that the prefixing in `signMessage` appropriately considers hex strings
    // as bytes the same way the native RPC signing would

    const message = web3.utils.soliditySha3('message')
    const nativeSignature = await nativeSigner.sign(message)
    parseSignature(message, nativeSignature, account)

    const localSignature = await localSigner.sign(message)
    parseSignature(message, localSignature, account)

    expect(nativeSignature).toEqual(localSignature)
  })
})
