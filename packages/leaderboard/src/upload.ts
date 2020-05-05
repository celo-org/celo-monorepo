import { ContractKit, IdentityMetadataWrapper, newKit } from '@celo/contractkit'
import { ClaimTypes } from '@celo/contractkit/lib/identity'
import { verifyAccountClaim } from '@celo/contractkit/lib/identity/claims/verify'
import { BigNumber } from 'bignumber.js'
import fs from 'fs'
import { google } from 'googleapis'
import readline from 'readline'

process.on('unhandledRejection', (reason, _promise) => {
  // @ts-ignore
  console.log('Unhandled Rejection at:', reason.stack || reason)
  process.exit(0)
})

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'

const LEADERBOARD_TOKEN = process.env['LEADERBOARD_TOKEN'] || 0
const LEADERBOARD_SHEET =
  process.env['LEADERBOARD_SHEET'] || '1TxrgEaY7I9wc8eKE1zQrpBiCXwJWFiMufwbbgbLhLUU'
const LEADERBOARD_WEB3 = process.env['LEADERBOARD_WEB3'] || 'http://localhost:8545'

function getCredentials() {
  let credentials = process.env['LEADERBOARD_CREDENTIALS']
  if (!credentials) {
    return fs.readFileSync('credentials.json')
  }
  return credentials
}

async function getMetadata(kit: ContractKit, address: string) {
  const accounts = await kit.contracts.getAccounts()
  const url = await accounts.getMetadataURL(address)
  console.log(address, 'has url', url)
  if (url === '') return IdentityMetadataWrapper.fromEmpty(address)
  try {
    let data = await IdentityMetadataWrapper.fetchFromURL(kit, url)
    return data
  } catch (err) {
    console.error('Cannot fetch metadata', err)
    return IdentityMetadataWrapper.fromEmpty(address)
  }
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
  for (const claim of data.claims) {
    switch (claim.type) {
      case ClaimTypes.KEYBASE:
        break
      case ClaimTypes.ACCOUNT:
        try {
          const status = await verifyAccountClaim(kit, claim, '0x' + address)
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

function readSheet(cb: any) {
  const content = getCredentials()
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content.toString()), (auth: any) => {
    getInfo(auth, cb)
  })
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials: any, callback: any) {
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

  if (LEADERBOARD_TOKEN) {
    oAuth2Client.setCredentials(JSON.parse(LEADERBOARD_TOKEN.toString()))
    callback(oAuth2Client)
  }
  // Check if we have previously stored a token.
  else
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client, callback)
      oAuth2Client.setCredentials(JSON.parse(token.toString()))
      callback(oAuth2Client)
    })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client: any, callback: any) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err: any, token: any) => {
      if (err) return console.error('Error while trying to retrieve access token', err)
      oAuth2Client.setCredentials(token)
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
      callback(oAuth2Client)
    })
  })
}

function getInfo(auth: any, cb: any) {
  const sheets = google.sheets({ version: 'v4', auth })
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: LEADERBOARD_SHEET,
      range: 'TGCSO!A3:C',
    },
    (err, res) => {
      if (err) return console.log('The API returned an error: ' + err)
      if (res == null) return
      const rows = res.data.values
      if (rows && rows.length) {
        cb(rows, sheets)
      } else {
        console.log('No data found.')
      }
    }
  )
}

function makeRequest(sheets: any, column: string, data: string[]) {
  let req = {
    spreadsheetId: LEADERBOARD_SHEET,
    range: `TGCSO!${column}3`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      range: `TGCSO!${column}3`,
      majorDimension: 'COLUMNS',
      values: [data],
    },
  }
  sheets.spreadsheets.values.update(req, (err: any, res: any) => {
    console.log(res, err)
  })
}

async function updateNames(kit: ContractKit, addresses: any[], sheets: any) {
  let accounts = await kit.contracts.getAccounts()
  let data = []
  for (let item of addresses) {
    if (!item) data.push('')
    else {
      let name = await accounts.getName(item)
      console.log('Name for', item, name)
      data.push(name)
    }
  }
  makeRequest(sheets, 'D', data)
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

async function getBTUs(kit: ContractKit, accounts: string[]) {
  let sum = new BigNumber(0)
  for (const address of accounts) {
    try {
      const balance = await kit.getTotalBalance(address)
      sum = sum.plus(balance.total)
    } catch (err) {
      console.error('Error', err)
    }
  }
  return sum.multipliedBy(new BigNumber('1e-18')).toString(10)
}

async function updateBTUs(kit: ContractKit, rows: string[][], sheets: any) {
  let data = []
  for (let item of rows) {
    try {
      let v = await getBTUs(kit, item)
      console.log('BTU for', item[0], v)
      data.push(v)
    } catch (err) {
      console.error('Cannot find BTU for', item[0], err)
      data.push('')
    }
  }
  makeRequest(sheets, 'E', data)
}

async function getAttestations(kit: ContractKit, address: string) {
  let attestations = await kit._web3Contracts.getAttestations()
  let req = (
    await attestations.getPastEvents('AttestationIssuerSelected', {
      fromBlock: 0,
      filter: { issuer: address },
    })
  ).length
  let full = (
    await attestations.getPastEvents('AttestationCompleted', {
      fromBlock: 0,
      filter: { issuer: address },
    })
  ).length
  return { req, full }
}

async function updateAttestations(kit: ContractKit, rows: string[][], sheets: any) {
  let data = []
  for (let item of rows) {
    let address = item[0]
    if (!address) data.push('=0')
    else {
      try {
        let reqAcc = 0
        let fullAcc = 0
        for (let account of item) {
          let { req, full } = await getAttestations(kit, account)
          reqAcc += req
          fullAcc += full
        }
        console.log('Attestations requested', reqAcc, 'fulfilled', fullAcc, 'by', address)
        if (reqAcc == 0) data.push('=0')
        else data.push('=' + (fullAcc / reqAcc).toString())
      } catch (err) {
        console.error('Cannot resolve attestations for', address, err)
        data.push('=0')
      }
    }
  }
  makeRequest(sheets, 'G', data)
}

function main() {
  const kit: ContractKit = newKit(LEADERBOARD_WEB3)
  readSheet(async (rows: any[][], sheets: any) => {
    let addresses = rows.map((a) => a[0])
    updateNames(kit, addresses, sheets)
    //    let accounts = await Promise.all(addresses.map((address) => getClaimedAccounts(kit, address)))
    let accounts = []
    for (let address of addresses) {
      accounts.push(await getClaimedAccounts(kit, address))
    }
    updateBTUs(kit, accounts, sheets)
    updateAttestations(kit, accounts, sheets)
  })
}

main()
