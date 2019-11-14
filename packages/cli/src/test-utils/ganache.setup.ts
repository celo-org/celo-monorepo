// @ts-ignore
import * as ganache from '@celo/ganache-cli'
import * as path from 'path'

const MNEMONIC = 'concert load couple harbor equip island argue ramp clarify fence smart topic'

export async function startGanache(datadir: string, opts: { verbose?: boolean } = {}) {
  const logFn = opts.verbose
    ? // tslint:disable-next-line: no-console
      (...args: any[]) => console.log(...args)
    : () => {
        /*nothing*/
      }

  const server = ganache.server({
    default_balance_ether: 1000000,
    logger: {
      log: logFn,
    },
    network_id: 1101,
    db_path: datadir,
    mnemonic: MNEMONIC,
    gasLimit: 7000000,
    allowUnlimitedContractSize: true,
  })

  await new Promise((resolve, reject) => {
    server.listen(8545, (err: any, blockchain: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(blockchain)
      }
    })
  })

  return () =>
    new Promise((resolve, reject) => {
      server.close((err: any) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
}

export default function setup() {
  const DATADIR = path.resolve(path.join(__dirname, '../../.devchain'))
  // console.log('Starting Ganache: datadir=', DATADIR)
  return startGanache(DATADIR)
    .then((stopGanache) => {
      ;(global as any).stopGanache = stopGanache
    })
    .catch((err) => {
      console.error('Error starting ganache, Doing `yarn test:prepare` might help')
      console.error(err)
      process.exit(1)
    })
}
