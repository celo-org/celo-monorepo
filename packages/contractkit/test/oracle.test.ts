import { Logger, LogLevel } from '../src/logger'
import { makeReportTx } from 'src/oracle'

beforeAll(() => {
  Logger.setLogLevel(LogLevel.VERBOSE)
})

describe('Oracle', () => {
  describe('#makeReportTx', () => {
    makeReportTx()
    // it('Should get the right keys in a long list', async () => {

    // })
  })
})
