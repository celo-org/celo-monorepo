/* tslint:disable no-console */
import FormData from 'form-data'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const artifactBasePath = './build/contracts'
  const artifactPaths = fs.readdirSync(artifactBasePath)
  const network = process.env.NETWORK || 'development'

  console.log('Uploading sources & metadata')
  console.log('============================')
  console.log(artifactPaths)

  for (const _path of artifactPaths) {
    const artifact = require(path.join(process.cwd(), artifactBasePath, _path))

    console.log()
    console.log(artifact.contractName)
    console.log('-'.repeat(artifact.contractName.length))

    const chainId = Object.keys(artifact.networks)[0]
    const address = artifact.networks[chainId].address

    const formData = new FormData()
    formData.append('files', fs.createReadStream(artifactBasePath + '/' + _path))
    formData.append('address', address)
    formData.append('chain', chainId)

    await fetch('https://sourcify.dev/server', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((json) =>
        fetch(
          `https://${network}-blockscout.celo-testnet.org/address/${json.result[0].address}/contracts`
        )
      )

    console.log(`Waiting 2 seconds before sending next file...`)
    await sleep(2000)
  }
  console.log('Finished.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
