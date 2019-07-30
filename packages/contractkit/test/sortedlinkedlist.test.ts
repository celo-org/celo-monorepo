import BigNumber from 'bignumber.js'
import { getLesserAndGreaterKeys, ListElement, NULL_ADDRESS } from '../src/sortedlinkedlist'

import { Logger, LogLevel } from '../src/logger'

beforeAll(() => {
  Logger.setLogLevel(LogLevel.VERBOSE)
})

describe('SortedLinkedList', () => {
  let sortedElems: ListElement[]
  beforeEach(() => {
    const n: number = 100
    const numbers1toN = Array.from(Array(n).keys())
    const sortedValues = numbers1toN.reverse().map<BigNumber>((e) => new BigNumber(e))
    sortedElems = sortedValues.map<ListElement>((val) => {
      return {
        key: '0x' + val.toString(),
        value: val,
      }
    })
  })

  describe('#getLesserAndGreaterKeys', () => {
    it('Should get the right keys in a long list', async () => {
      const { lesserKey, greaterKey } = getLesserAndGreaterKeys(
        {
          key: 'newKey',
          value: new BigNumber(50),
        },
        sortedElems
      )
      expect(lesserKey).toBe('0x49')
      expect(greaterKey).toBe('0x51')
    })

    it('Should get NULL_ADDRESS when no key is lesser', async () => {
      const { lesserKey } = getLesserAndGreaterKeys(
        {
          key: 'newKey',
          value: new BigNumber(0),
        },
        sortedElems
      )
      expect(lesserKey).toBe(NULL_ADDRESS)
    })

    it('Should get NULL_ADDRESS when no key is greater', async () => {
      const { greaterKey } = getLesserAndGreaterKeys(
        {
          key: 'newKey',
          value: new BigNumber(100),
        },
        sortedElems
      )
      expect(greaterKey).toBe(NULL_ADDRESS)
    })

    it('Should not return lesser which has equal key', async () => {
      const { lesserKey } = getLesserAndGreaterKeys(
        {
          key: '0x49',
          value: new BigNumber(50),
        },
        sortedElems
      )
      expect(lesserKey).toBe('0x48')
    })

    it('Should not return greater which has equal key', async () => {
      const { greaterKey } = getLesserAndGreaterKeys(
        {
          key: '0x51',
          value: new BigNumber(50),
        },
        sortedElems
      )
      expect(greaterKey).toBe('0x52')
    })
  })
})
