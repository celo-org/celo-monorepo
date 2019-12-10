import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import Web3 from 'web3'
import { Client } from 'pg'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { verifyAccountClaim } from '@celo/contractkit/lib/identity/claims/verify'

const GoogleSpreadsheet = require('google-spreadsheet')

function addressToBinary(a: string) {
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

function readSheet() {
  // spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(LEADERBOARD_SHEET)

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
          if (e.col == 3) {
            arr[e.row].multiplier = e.numericValue
          }
        }
        let lst = Object.values(arr)
        updateDB(
          lst.filter((a: any) => !!a.address && a.multiplier !== 0),
          lst.filter((a: any) => !!a.address && a.multiplier === 0)
        )
      }
    )
  })
}

async function updateDB(lst: any[], remove: any[]) {
  console.log('Adding', lst)
  const client = new Client({ database: LEADERBOARD_DATABASE })
  await client.connect()
  await client.query(
    'INSERT INTO competitors (address, multiplier)' +
      " SELECT decode(m.address, 'hex') AS address, m.multiplier FROM json_populate_recordset(null::json_type, $1) AS m" +
      ' ON CONFLICT (address) DO UPDATE SET multiplier = EXCLUDED.multiplier RETURNING *',
    [JSON.stringify(lst)]
  )
  console.log('Removing', remove)
  for (let elem of remove) {
    await client.query(
      "DELETE FROM competitors WHERE address = '\\x" + elem.address.toString() + "'"
    )
  }
  await client.end()
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

async function processClaims(kit: ContractKit, address: string, info: IdentityMetadataWrapper) {
  try {
    const lst: string[] = await getClaims(kit, address, info)
    const client = new Client({ database: LEADERBOARD_DATABASE })
    await client.connect()
    await client.query(
      'INSERT INTO claims (address, claimed_address)' +
        " SELECT decode(m.address,'hex'), decode(m.claimed_address,'hex') FROM json_populate_recordset(null::json_assoc, $1) AS m" +
        ' ON CONFLICT (address, claimed_address) DO NOTHING RETURNING *',
      [
        JSON.stringify(
          lst.map((a) => {
            const res = { address: addressToBinary(address), claimed_address: addressToBinary(a) }
            return res
          })
        ),
      ]
    )
    await client.end()
  } catch (err) {
    console.error('Cannot process claims', err)
  }
}

async function readAssoc(lst: string[]) {
  const web3 = new Web3(LEADERBOARD_WEB3)
  const kit: ContractKit = newKitFromWeb3(web3)
  const accounts: AccountsWrapper = await kit.contracts.getAccounts()
  lst.forEach(async (a) => {
    try {
      const url = await accounts.getMetadataURL(a)
      console.log(a, 'has url', url)
      let metadata: IdentityMetadataWrapper
      if (url == '') metadata = IdentityMetadataWrapper.fromEmpty(a)
      else metadata = await IdentityMetadataWrapper.fetchFromURL(url)
      processClaims(kit, a, metadata)
    } catch (err) {
      console.error('Bad address', a, err.toString())
    }
  })
}

readSheet()
