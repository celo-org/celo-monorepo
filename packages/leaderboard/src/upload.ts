import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import { ContractKit, newKitFromWeb3, IdentityMetadataWrapper } from '@celo/contractkit'
import Web3 from 'web3'
import { ClaimTypes } from '@celo/contractkit/lib/identity'
import { verifyAccountClaim } from '@celo/contractkit/lib/identity/claims/verify'
import { BigNumber } from 'bignumber.js'

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

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'

const LEADERBOARD_TOKEN = process.env['LEADERBOARD_TOKEN'] || 0
const LEADERBOARD_SHEET =
  process.env['LEADERBOARD_SHEET'] || '1TxrgEaY7I9wc8eKE1zQrpBiCXwJWFiMufwbbgbLhLUU'

function getCredentials() {
  let credentials = process.env['LEADERBOARD_CREDENTIALS']
  if (!credentials) {
    return fs.readFileSync('credentials.json')
  }
  return credentials
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

async function updateNames(kit: ContractKit, rows: any[][], sheets: any) {
  let accounts = await kit.contracts.getAccounts()
  let data = []
  for (let item of rows) {
    if (!item[0]) data.push('')
    else {
      let name = await accounts.getName(item[0])
      console.log('Name for', item[0], name)
      data.push(name)
    }
  }
  let req = {
    spreadsheetId: LEADERBOARD_SHEET,
    range: 'TGCSO!D3',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      range: 'TGCSO!D3',
      majorDimension: 'COLUMNS',
      values: [data],
    },
  }
  sheets.spreadsheets.values.update(req, (err: any, res: any) => {
    console.log(res, err)
  })
}

async function getBTUs(kit: ContractKit, address: string) {
  const metadata = await getMetadata(kit, address)
  const claimedAccounts = await getClaims(kit, address, metadata)

  let sum = new BigNumber(0)
  for (const address of claimedAccounts) {
    try {
      const balance = await kit.getTotalBalance(address)
      sum = sum.plus(balance.total)
    } catch (err) {
      console.error('Error', err)
    }
  }
  return sum.multipliedBy(new BigNumber('1e-18')).toString(10)
}

async function updateBTUs(kit: ContractKit, rows: any[][], sheets: any) {
  let data = []
  for (let item of rows) {
    let address = item[0]
    if (!address) data.push('')
    else {
      try {
        let v = await getBTUs(kit, address)
        console.log('BTU for', address, v)
        data.push(v)
      } catch (err) {
        console.error('Cannot find BTU for', address, err)
        data.push('')
      }
    }
  }
  let req = {
    spreadsheetId: LEADERBOARD_SHEET,
    range: 'TGCSO!E3',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      range: 'TGCSO!E3',
      majorDimension: 'COLUMNS',
      values: [data],
    },
  }
  sheets.spreadsheets.values.update(req, (err: any, res: any) => {
    console.log(res, err)
  })
}

async function updateAttestations(kit: ContractKit, rows: any[][], sheets: any) {
  let data = []
  let attestations = await kit._web3Contracts.getAttestations()
  for (let item of rows) {
    let address = item[0]
    if (!address) data.push('')
    else {
      try {
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
        console.log('Attestations requested', req, 'fulfilled', full, 'by', address)
        if (req == 0) data.push(0)
        else data.push(full / req)
      } catch (err) {
        console.error('Cannot resolve attestations for', address, err)
        data.push('')
      }
    }
  }
  let req = {
    spreadsheetId: LEADERBOARD_SHEET,
    range: 'TGCSO!G3',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      range: 'TGCSO!G3',
      majorDimension: 'COLUMNS',
      values: [data],
    },
  }
  sheets.spreadsheets.values.update(req, (err: any, res: any) => {
    console.log(res, err)
  })
}

function main() {
  const web3 = new Web3('http://localhost:8545')
  const kit: ContractKit = newKitFromWeb3(web3)
  readSheet((rows: any, sheets: any) => {
    updateNames(kit, rows, sheets)
    updateBTUs(kit, rows, sheets)
    updateAttestations(kit, rows, sheets)
  })
}

main()
