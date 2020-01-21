import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { verifyAccountClaim } from '@celo/contractkit/lib/identity/claims/verify'
import { Client } from 'pg'
import Web3 from 'web3'

const GoogleSpreadsheet = require('google-spreadsheet')

function addressToBinary(a: string) {
  a = a.toLowerCase()
  try {
    if (a.substr(0, 2) == '0x') return a.substr(2)
    else return a
  } catch (_err) {
    return a
  }
}

process.on('unhandledRejection', (reason, _promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason)
  process.exit(0)
})

const LEADERBOARD_DATABASE = process.env['LEADERBOARD_DATABASE'] || 'blockscout'
const LEADERBOARD_SHEET =
  process.env['LEADERBOARD_SHEET'] || '1HCs1LZv1BOB1v2bVlH4qNPnxVRlYVhQ7CKhkMibE4EY'
const LEADERBOARD_WEB3 = process.env['LEADERBOARD_WEB3'] || 'http://localhost:8545'
const client = new Client({ database: LEADERBOARD_DATABASE })

async function readSheet() {
  // spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(LEADERBOARD_SHEET)
  await client.connect()

  try {
    await client.query(
      'CREATE type json_attestation AS (address char(40), requested integer, fulfilled integer)'
    )
  } catch (err) {
    console.log('JSON type already exists')
  }
  doc.getInfo(function(_err: any, info: any) {
    let sheet = info.worksheets[0]
    sheet.getCells(
      {
        'min-row': 3,
        'max-row': 500,
        'min-col': 1,
        'max-col': 3,
        'return-empty': true,
      },
      function(err: any, cells: any) {
        console.log(err)
        let arr: any = {}
        for (let e of cells) {
          // console.log(e)
          arr[e.row] = arr[e.row] || {}
          if (e.col == 1) {
            arr[e.row].address = addressToBinary(e.value)
          }
        }
        let lst = Object.values(arr)
        updateDB(lst.filter((a: any) => !!a.address && a.multiplier !== 0))
      }
    )
  })
}

async function updateDB(lst: any[]) {
  await readAssoc(lst.map((a: any) => a.address.toString()))
}

function dedup(lst: string[]): string[] {
  return [...new Set(lst)]
}

async function getClaims(
  kit: ContractKit,
  address: string,
  data: IdentityMetadataWrapper
): Promise<string[]> {
  if (address.substr(0, 2) === '0x') {
    address = address.substr(2)
  }
  const res = [address]
  const accounts = await kit.contracts.getAccounts()
  for (const claim of data.claims) {
    switch (claim.type) {
      case ClaimTypes.KEYBASE:
        break
      case ClaimTypes.ACCOUNT:
        try {
          const status = await verifyAccountClaim(claim, '0x' + address, accounts.getMetadataURL)
          if (status) console.error('Cannot verify claim:', status)
          else {
            console.log('Claim success', address, claim.address)
            res.push(claim.address)
          }
        } catch (err) {
          console.error('Cannot fetch metadata', err)
        }
      default:
        break
    }
  }
  return dedup(res)
}

async function getMetadata(kit: ContractKit, address: string) {
  const accounts = await kit.contracts.getAccounts()
  const url = await accounts.getMetadataURL(address)
  console.log(address, 'has url', url)
  if (url === '') return IdentityMetadataWrapper.fromEmpty(address)
  try {
    let data = await IdentityMetadataWrapper.fetchFromURL(url)
    return data
  } catch (err) {
    console.error('Cannot fetch metadata', err)
    return IdentityMetadataWrapper.fromEmpty(address)
  }
}

async function getClaimedAccounts(kit: ContractKit, address: string) {
  if (!address) return []
  try {
    const metadata = await getMetadata(kit, address)
    const res = getClaims(kit, address, metadata)
    return res
  } catch (err) {
    console.error('Error', err)
    return [address]
  }
}

async function getAttestations(kit: ContractKit, address: string) {
  let attestations = await kit._web3Contracts.getAttestations()
  let requested = (
    await attestations.getPastEvents('AttestationIssuerSelected', {
      fromBlock: 0,
      filter: { issuer: address },
    })
  ).length
  let fulfilled = (
    await attestations.getPastEvents('AttestationCompleted', {
      fromBlock: 0,
      filter: { issuer: address },
    })
  ).length
  const res = { requested, fulfilled, address }
  console.log(res)
  return res
}

async function storeData(data: any[]) {
  try {
    await client.query(
      'INSERT INTO celo_account as a (address, attestations_requested, attestations_fulfilled, inserted_at, updated_at) ' +
        " SELECT decode(m.address,'hex'), m.requested, m.fulfilled, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP " +
        ' FROM json_populate_recordset(null::json_attestation, $1) AS m' +
        ' ON CONFLICT (address) DO UPDATE SET attestations_requested = EXCLUDED.attestations_requested, ' +
        ' attestations_fulfilled = EXCLUDED.attestations_fulfilled, ' +
        ' inserted_at = CURRENT_TIMESTAMP, ' +
        ' updated_at = CURRENT_TIMESTAMP ',
      [JSON.stringify(data)]
    )
  } catch (err) {
    console.error('Cannot store data', err)
  }
}

async function readAssoc(addresses: string[]) {
  const web3 = new Web3(LEADERBOARD_WEB3)
  const kit: ContractKit = newKitFromWeb3(web3)
  let accounts: string[] = []
  for (let address of addresses) {
    accounts = accounts.concat(await getClaimedAccounts(kit, address))
  }
  accounts = dedup(accounts.map(addressToBinary))
  let data: any[] = []
  for (let account of accounts) {
    data.push(await getAttestations(kit, account))
  }
  await storeData(data)
  client.end()
}

readSheet()
