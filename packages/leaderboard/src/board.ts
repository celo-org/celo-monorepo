import { ContractKit, newKitFromWeb3, CeloContract } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import Web3 from 'web3'
import http from 'http'
import { Client } from 'pg'
import { verifyClaim, Claim } from '@celo/contractkit/lib/identity/claims/claim'
import { ClaimTypes } from '@celo/contractkit/lib/identity'

const GoogleSpreadsheet = require('google-spreadsheet')

function addressToBinary(a: string) {
  try {
    if (a.substr(0, 2) == '0x') return a.substr(2)
    else return a
  } catch (_err) {
    return a
  }
}

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
        updateDB(Object.values(arr).filter((a: any) => !!a.address && a.multiplier !== 0))
      }
    )
  })
}

async function updateDB(lst: any[]) {
  console.log(lst)
  const client = new Client({ database: LEADERBOARD_DATABASE })
  await client.connect()
  const res = await client.query(
    'INSERT INTO competitors (address, multiplier)' +
      " SELECT decode(m.address, 'hex') AS address, m.multiplier FROM json_populate_recordset(null::json_type, $1) AS m" +
      ' ON CONFLICT (address) DO UPDATE SET multiplier = EXCLUDED.multiplier RETURNING *',
    [JSON.stringify(lst)]
  )
  console.log(res.rows)
  await client.end()
  await readAssoc(lst.map((a: any) => a.address.toString()))
}

async function updateRate(kit: ContractKit) {
  const client = new Client({ database: LEADERBOARD_DATABASE })
  await client.connect()
  const token = await kit.contracts.getStableToken()
  const oracle = await kit.contracts.getSortedOracles()
  const rate = await oracle.medianRate(CeloContract.StableToken)

  console.log(token.address)

  const res = await client.query(
    'INSERT INTO exchange_rates (token, rate) VALUES ($1, $2)' +
      ' ON CONFLICT (token) DO UPDATE SET rate = EXCLUDED.rate RETURNING *',
    [Buffer.from(token.address.substr(2), 'hex'), rate.rate.toNumber()]
  )
  console.log(res.rows)
  await client.end()
}

async function processClaims(kit: ContractKit, address: string, data: string) {
  try {
    console.log('process claim', address, data)
    const info: any = JSON.parse(data)
    const orig_lst: any[] = info.claims
    const lst: string[] = []
    const accounts = await kit.contracts.getAccounts()
    for (let i = 0; i < orig_lst.length; i++) {
      console.log('account claim', orig_lst[i])
      let claim: Claim = {
        type: ClaimTypes.ACCOUNT,
        timestamp: orig_lst[i].timestamp,
        address: orig_lst[i].address,
        publicKey: undefined,
      }
      const status = await verifyClaim(claim, address, accounts.getMetadataURL)
      if (status) console.error(status)
      else lst.push(claim.address)
    }
    lst.push(address)
    const client = new Client({ database: LEADERBOARD_DATABASE })
    await client.connect()
    const res = await client.query(
      'INSERT INTO claims (address, claimed_address)' +
        " SELECT decode(m.address,'hex'), decode(m.claimed_address,'hex') FROM json_populate_recordset(null::json_assoc, $1) AS m" +
        ' ON CONFLICT (address, claimed_address) DO NOTHING RETURNING *',
      [
        JSON.stringify(
          lst.map((a) => {
            const res = { address: addressToBinary(address), claimed_address: addressToBinary(a) }
            console.log(res)
            return res
          })
        ),
      ]
    )
    console.log(res.rows)
    await client.end()
  } catch (err) {
    console.error('Cannot process claims', err)
  }
}

async function readAssoc(lst: string[]) {
  const web3 = new Web3(LEADERBOARD_WEB3)
  const kit: ContractKit = newKitFromWeb3(web3)
  updateRate(kit)
  const accounts: AccountsWrapper = await kit.contracts.getAccounts()
  function getFromUrl(a: string, url: string) {
    http
      .get(url, (resp) => {
        let data = ''
        resp.on('data', (chunk) => (data += chunk))
        resp.on('end', () => processClaims(kit, a, data))
      })
      .on('error', (err) => console.log('Error: ' + err.message))
  }
  lst.forEach(async (a) => {
    try {
      const url = await accounts.getMetadataURL(a)
      if (url == '') processClaims(kit, a, '{"claims": []}')
      else getFromUrl(a, url)
    } catch (err) {
      console.error('Bad address', a, err.toString())
    }
  })
}

readSheet()
