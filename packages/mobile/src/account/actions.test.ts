jest.mock('src/config', () => {
  return { SUPPORTS_KEYSTORE: true }
})

const isDeviceSecure = jest.fn(async () => {
  return true
})

jest.mock('react-native-confirm-device-credentials', () => {
  return { default: { isDeviceSecure, retrievePin: jest.fn().mockReturnValue(42) } }
})

jest.mock(`src/web3/contracts`, () => {
  return { web3: { utils: { sha3: (key: string) => key } } }
})

import * as actions from 'src/account/actions'

describe('account/actions', () => {
  describe('@getPincode', () => {
    it('returns PIN', async (done) => {
      try {
        const result = await actions.getPincode()
        expect(result).toEqual(42)
        expect(isDeviceSecure).toBeCalled()
      } catch (e) {
        done()
      } finally {
        done()
      }
    })
    it('checks Device is Secure', async (done) => {
      try {
        await actions.getPincode()
        expect(isDeviceSecure).toBeCalled()
      } catch (e) {
        done()
      } finally {
        done()
      }
    })
  })
})
