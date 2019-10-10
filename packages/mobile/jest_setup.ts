import { configure } from 'enzyme'
// @ts-ignore TODO(cmcewen): remove enzyme
import Adapter from 'enzyme-adapter-react-16'
import { GlobalWithFetchMock } from 'jest-fetch-mock'
import scrypt from 'scrypt-js'

// @ts-ignore
const svgMock = require('react-native-svg-mock')
configure({ adapter: new Adapter() })

jest.useFakeTimers()

const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock
customGlobal.fetch = require('jest-fetch-mock')
customGlobal.fetchMock = customGlobal.fetch

jest.mock('react-native-fast-crypto', () => {
  return {
    scrypt: async (
      identifier: Buffer,
      salt: Buffer,
      N: number,
      r: number,
      p: number,
      dkLen: number
    ) => {
      const hash = await new Promise<string>((resolve) => {
        scrypt(identifier, salt, N, r, p, dkLen, (error: any, progress: any, key: any) => {
          if (error) {
            throw Error(`Unable to hash ${identifier}, error: ${error}`)
          } else if (key) {
            let hexHash = ''
            for (const item of key) {
              hexHash += item.toString(16)
            }
            // @ts-ignore
            resolve('0x' + hexHash.padStart(64, '0'))
          } else if (progress) {
            // do nothing
          }
        })
      })
      return hash
    },
  }
})

if (typeof window !== 'object') {
  // @ts-ignore
  global.window = global
  // @ts-ignore
  global.window.navigator = {}
}
