import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import Web3 from 'web3'
import http from 'http'
import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import { Client } from 'pg'

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'

/*

CREATE TABLE competitors (
  address BYTEA PRIMARY KEY,
  multiplier REAL
);

CREATE TABLE claims (
  address BYTEA,
  claim_address BYTEA,
  CONSTRAINT assoc PRIMARY KEY(address, claim_address)
)

CREATE type json_type AS (address bytea, multiplier real);

CREATE type json_assoc AS (address bytea, claim_address bytea);

*/

async function updateDB(lst: any[][]) {
  const client = new Client({ database: 'blockscout' })
  await client.connect()
  const res = await client.query(
    'INSERT INTO competitors (address, multiplier) SELECT m.* FROM json_populate_recordset(null::json_type, $1) AS m' +
      ' ON CONFLICT ON CONSTRAINT competitors_pkey DO UPDATE SET multiplier = EXCLUDED.multiplier RETURNING *',
    [
      JSON.stringify(
        lst.map((a) => {
          return { address: a[0], multiplier: a[1] }
        })
      ),
    ]
  )
  console.log(res.rows)
  await client.end()
  await readAssoc(lst.map((a) => a[0].toString()))
}

async function processClaims(address: string, lst: string[]) {
  const client = new Client({ database: 'blockscout' })
  await client.connect()
  const res = await client.query(
    'INSERT INTO claims (address, claim_address) SELECT m.* FROM json_populate_recordset(null::json_type, $1) AS m' +
      ' ON CONFLICT ON CONSTRAINT claims_assoc DO NOTHING RETURNING *',
    [
      JSON.stringify(
        lst.map((a) => {
          return { address, claim_address: a }
        })
      ),
    ]
  )
  console.log(res.rows)
  await client.end()
}

readSheet()

function readSheet() {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err)
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content.toString()), getInfo)
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

  // Check if we have previously stored a token.
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

function getInfo(auth: any) {
  const sheets = google.sheets({ version: 'v4', auth })
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: '1d3pZNof8p3z8M9O3MH5FZG5dA3e-L52XiJ4qA5o7X0Y',
      range: 'Sheet1!A2:B',
    },
    (err, res) => {
      if (err) return console.log('The API returned an error: ' + err)
      if (res == null) return
      const rows = res.data.values
      if (rows && rows.length) {
        console.log(rows)
        updateDB(rows)
      } else {
        console.log('No data found.')
      }
    }
  )
}

async function readAssoc(lst: string[]) {
  const web3 = new Web3('http://localhost:8545')
  const kit: ContractKit = newKitFromWeb3(web3)
  const accounts: AccountsWrapper = await kit.contracts.getAccounts()
  async function getFromUrl(a: string, url: string) {
    http
      .get(url, (resp) => {
        let data = ''
        resp.on('data', (chunk) => (data += chunk))
        resp.on('end', () => processClaims(a, JSON.parse(data).claims))
      })
      .on('error', (err) => console.log('Error: ' + err.message))
  }
  lst.forEach(async (a) => {
    const url = await accounts.getMetadataURL(a)
    getFromUrl(a, url)
  })
}
