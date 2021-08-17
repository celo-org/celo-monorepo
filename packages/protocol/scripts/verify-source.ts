import FormData from 'form-data'
import { createReadStream, readdirSync, readFileSync, readJsonSync } from 'fs-extra'
import { ASTDetailedVersionedReport } from 'lib/compatibility/report'
import fetch from 'node-fetch'
import { basename, join } from 'path'

const network = process.env.NETWORK ?? 'mainnet'
const networkChainId = require(join(__dirname, '../truffle-config.js')).networks[network].network_id
const networkAddresses = require(join(__dirname, `../../cli/${network}-contracts.json`))

const latestVersion = parseInt(process.env.LATEST_VERSION ?? '4', 10)

const versionToTag = (version: number) => `core-contracts.v${version}`
const versionToBuildDir = (version: number) =>
  join(__dirname, `../build/${versionToTag(version)}/contracts`)
const versionToReport = (version: number) =>
  join(__dirname, `../releaseData/versionReports/release${version}-report.json`)

interface Artifact {
  metadata: string
  sourcePath: string
}

const versionedSourceMap: { [contract: string]: Artifact } = {}

for (let i = 0; i <= latestVersion; i++) {
  let contracts = readdirSync(versionToBuildDir(i))
    .map((contractFile) => basename(contractFile, '.json'))
    .filter((c) => versionedSourceMap[c] === undefined)

  if (i > 0) {
    const report: ASTDetailedVersionedReport = readJsonSync(versionToReport(i)).report
    contracts = contracts
      .concat(Object.keys(report.contracts))
      .concat(Object.keys(report.libraries))
  }

  contracts.forEach((contract) => {
    const metadata = `${versionToBuildDir(i)}/${contract}.json`
    const sourcePath = readJsonSync(metadata).sourcePath
    versionedSourceMap[contract] = { metadata, sourcePath }
  })
}

const verifyList = ['Accounts']

Object.entries(versionedSourceMap)
  .filter(([contract]) => verifyList.includes(contract))
  .forEach(([contract, artifact]) => {
    try {
      const formdata = new FormData()
      formdata.append('chainId', networkChainId)
      const address = networkAddresses[contract].implementation
      formdata.append('address', address)

      // add contract source
      formdata.append('files', createReadStream(artifact.sourcePath), {
        filename: `${contract}.sol`,
        filepath: artifact.sourcePath,
      })

      // add contract metadata
      formdata.append('files', createReadStream(artifact.metadata), {
        filename: `${contract}.json`,
        filepath: artifact.metadata,
      })

      const suryaDeps = readFileSync(`${contract}Dependencies`).toString()
      const deps = suryaDeps
        .trim()
        .split('\n')
        .slice(1)
        .map((ds) => ds.slice(4))
      const depArtifacts = deps.map<[string, Artifact]>((dep) => [dep, versionedSourceMap[dep]])
      depArtifacts.forEach(([depContract, depArtifact]) =>
        // add contract dependencies source
        formdata.append('files', createReadStream(depArtifact.sourcePath), {
          filename: `${depContract}.sol`,
          filepath: depArtifact.sourcePath,
        })
      )

      const requestOptions = {
        method: 'POST',
        body: formdata,
      }

      fetch('https://sourcify.dev/server/input-files', requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error('request error', error))
    } catch (e) {
      console.error(`skipping ${contract}: \n ${e}`)
    }
  })
