// @ts-ignore
import * as ganache from '@celo/ganache-cli'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as targz from 'targz'

const MNEMONIC = 'concert load couple harbor equip island argue ramp clarify fence smart topic'
export const ACCOUNT_PRIVATE_KEYS = [
  '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
  '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72',
  '0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1',
  '0xff12e391b79415e941a94de3bf3a9aee577aed0731e297d5cfa0b8a1e02fa1d0',
  '0x752dd9cf65e68cfaba7d60225cbdbc1f4729dd5e5507def72815ed0d8abc6249',
  '0xefb595a0178eb79a8df953f87c5148402a224cdf725e88c0146727c6aceadccd',
  '0x83c6d2cc5ddcf9711a6d59b417dc20eb48afd58d45290099e5987e3d768f328f',
  '0xbb2d3f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2',
  '0xb2fd4d29c1390b71b8795ae81196bfd60293adf99f9d32a0aff06288fcdac55f',
  '0x23cb7121166b9a2f93ae0b7c05bde02eae50d64449b2cbb42bc84e9d38d6cc89',
]
export const ACCOUNT_ADDRESSES = [
  '0x5409ED021D9299bf6814279A6A1411A7e866A631',
  '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
  '0xE36Ea790bc9d7AB70C55260C66D52b1eca985f84',
  '0xE834EC434DABA538cd1b9Fe1582052B880BD7e63',
  '0x78dc5D2D739606d31509C31d654056A45185ECb6',
  '0xA8dDa8d7F5310E4A9E24F8eBA77E091Ac264f872',
  '0x06cEf8E666768cC40Cc78CF93d9611019dDcB628',
  '0x4404ac8bd8F9618D27Ad2f1485AA1B2cFD82482D',
  '0x7457d5E02197480Db681D3fdF256c7acA21bDc12',
  '0x91c987bf62D25945dB517BDAa840A6c661374402',
]

export async function startGanache(
  filePath: string,
  datafile: string,
  opts: { verbose?: boolean; from_targz?: boolean } = {}
) {
  const logFn = opts.verbose
    ? // tslint:disable-next-line: no-console
      (...args: any[]) => console.log(...args)
    : () => {
        /*nothing*/
      }
  const chainCopy: string = path.resolve(path.join(filePath, 'tmp/copychain'))
  console.log(filePath, datafile)
  const filenameWithPath: string = path.resolve(path.join(filePath, datafile))

  // erases tmp chain
  if (fs.existsSync(chainCopy)) {
    console.log(`Removing old chain tmp folder: ${chainCopy}`)
    fs.removeSync(chainCopy)
  }
  console.log(`Creating chain tmp folder: ${chainCopy}`)
  fs.mkdirsSync(chainCopy)

  if (opts.from_targz) {
    await decompressChain(filenameWithPath, chainCopy)
  } else {
    fs.copySync(filenameWithPath, chainCopy)
  }

  const server = ganache.server({
    default_balance_ether: 1000000,
    logger: {
      log: logFn,
    },
    network_id: 1101,
    db_path: chainCopy,
    mnemonic: MNEMONIC,
    gasLimit: 20000000,
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

function decompressChain(tarPath: string, copyChainPath: string): Promise<void> {
  console.log('Decompressing chain')
  return new Promise((resolve, reject) => {
    targz.decompress({ src: tarPath, dest: copyChainPath }, (err) => {
      if (err) {
        console.error(err)
        reject(err)
      } else {
        console.log('Chain decompressed')
        resolve()
      }
    })
  })
}

export default function setup(
  filePath: string,
  datafile: string,
  opts: { verbose?: boolean; from_targz?: boolean } = {}
) {
  return startGanache(filePath, datafile, opts)
    .then((stopGanache) => {
      ;(global as any).stopGanache = stopGanache
    })
    .catch((err) => {
      console.error('Error starting ganache, Doing `yarn test:prepare` might help')
      console.error(err)
      process.exit(1)
    })
}
