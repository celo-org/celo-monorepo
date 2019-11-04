import GenesisBlockUtils from '@celo/walletkit/lib/src/genesis-block-utils'
import { equal, notEqual } from 'assert'
import * as fs from 'fs'

// These tests read logs from a client which was running in Ultralight sync mode and verifies that
// only epoch headers are fetched till the height block and all headers are fetched afrerwards.
describe('Ultralight client', () => {
  let epoch: number

  before(async () => {
    const genesis = JSON.parse(await GenesisBlockUtils.getGenesisBlockAsync(argv.network))
    if (genesis.config.istanbul.epoch) {
      epoch = Number(genesis.config.istanbul.epoch)
    } else {
      throw Error('epoch not found in genesis block')
    }
  })

  beforeEach(function(this: any) {
    this.timeout(0)
  })

  const argv = require('minimist')(process.argv.slice(2))
  const logfile = argv.gethlogfile

  let origin: number = -1
  let height: number = 0
  const insertedHeaderNumbers: number[] = []

  console.debug('Reading logs from ' + logfile)
  const fileContents = fs.readFileSync(logfile, 'utf8')

  // Fetch origin
  const originInfo = fileContents.match('After the check origin is \\d+')
  if (originInfo === null) {
    throw Error('Origin is null')
  }
  const arr1 = originInfo[0].split(' ')
  origin = parseInt(arr1[arr1.length - 1], 10)
  console.debug('origin is ' + origin)

  // Fetch height
  const heightInfo = fileContents.match('height is \\d+')
  if (heightInfo === null) {
    throw Error('Height is null')
  }
  const arr2 = heightInfo[0].split(' ')
  height = parseInt(arr2[arr2.length - 1], 10)
  console.debug('Height is ' + height)

  // Fetch all inserted headers
  const insertedHeadersInfo = fileContents.match(
    new RegExp('Inserted new header.*?number=\\d+', 'g')
  )
  if (insertedHeadersInfo === null) {
    throw Error('insertedHeadersInfo is null')
  }
  insertedHeadersInfo.forEach((insertedHeader) => {
    const arr3 = insertedHeader.split('=')
    const headerNumber = parseInt(arr3[arr3.length - 1], 10)
    console.debug('Inserted header is ' + headerNumber)
    insertedHeaderNumbers.push(headerNumber)
  })

  it('sync must start from 0', () => {
    equal(origin, 0, 'Start header is not zero, it is ' + origin)
  })

  it('latest known header must be non-zero', () => {
    notEqual(height, 0, 'Latest known header is zero')
  })

  it('height header must be fetched', () => {
    let heightHeaderFetched: boolean = false
    for (const headerNumber of insertedHeaderNumbers) {
      if (headerNumber === height) {
        heightHeaderFetched = true
        break
      }
    }
    equal(heightHeaderFetched, true, 'height header ' + height + ' not fetched')
  })

  it('must only download epoch blocks till height', () => {
    for (const headerNumber of insertedHeaderNumbers) {
      if (headerNumber < height) {
        equal(headerNumber % epoch, 0, 'Non-epoch header below height fetched')
      }
    }
  })

  it('must fetch all headers after height', () => {
    for (
      let i = insertedHeaderNumbers.length - 1;
      i >= 0 && insertedHeaderNumbers[i] > height;
      i++
    ) {
      equal(
        insertedHeaderNumbers[i] - insertedHeaderNumbers[i - 1],
        1,
        'Header(s) between ' +
          insertedHeaderNumbers[i] +
          ' and ' +
          insertedHeaderNumbers[i - 1] +
          ' are missing'
      )
    }
  })
})
