import { ContractKit, newKitFromWeb3, CeloContract } from '@celo/contractkit'
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

SELECT competitors.address, SUM(rate*value+fetched_coin_balance+locked_gold)*multiplier AS score
FROM addresses, exchange_rates, competitors, claims, celo_account, address_current_token_balances
WHERE token_contract_address_hash='\x88f24de331525cf6cfd7455eb96a9e4d49b7f292'
 AND address_current_token_balances.address_hash=addresses.hash
 AND token='\x88f24de331525cf6cfd7455eb96a9e4d49b7f292'
 AND claims.claim_address = addresses.hash
 AND celo_account.address = addresses.hash
 AND claims.address = competitors.address
GROUP BY competitors.address
ORDER BY score;

SELECT rate*value+fetched_coin_balance+locked_gold AS score
FROM addresses, exchange_rates, celo_account,
 (SELECT '\x48b5d84d283bfcbfcf9cec22fe8e5b271f5a1c85' AS address, COALESCE(SUM(value),0) AS value
  FROM address_current_token_balances
  WHERE address_hash='\x48b5d84d283bfcbfcf9cec22fe8e5b271f5a1c85'
  AND token_contract_address_hash='\x88f24de331525cf6cfd7455eb96a9e4d49b7f292') AS get
WHERE token='\x88f24de331525cf6cfd7455eb96a9e4d49b7f292'
 AND addresses.hash='\x48b5d84d283bfcbfcf9cec22fe8e5b271f5a1c85'
 AND celo_account.address = addresses.hash

SELECT fetched_coin_balance, fetched_coin_balance_block_number, hash
FROM addresses;

SELECT competitors.address, SUM(rate*value+fetched_coin_balance+locked_gold)*multiplier AS score
FROM addresses, exchange_rates, competitors, claims, celo_account,
 (SELECT claims.claim_address AS address, COALESCE(SUM(value),0) AS value
  FROM address_current_token_balances, claims
  WHERE address_hash=claims.claim_address
  AND token_contract_address_hash='\x88f24de331525cf6cfd7455eb96a9e4d49b7f292'
  GROUP BY claims.claim_address) AS get
WHERE  token='\x88f24de331525cf6cfd7455eb96a9e4d49b7f292'
 AND claims.claim_address = get.address
 AND celo_account.address = addresses.hash
 AND claims.address = competitors.address
GROUP BY competitors.address
ORDER BY score;


*/

function addressToBinary(a: string) {
  try {
    if (a.substr(0, 2) == '0x') return a.substr(2)
    else return a
  } catch (_err) {
    return a
  }
}

async function updateDB(lst: any[][]) {
  const client = new Client({ database: 'blockscout' })
  await client.connect()
  const res = await client.query(
    'INSERT INTO competitors (address, multiplier)' +
      " SELECT decode(m.address, 'hex') AS address, m.multiplier FROM json_populate_recordset(null::json_type, $1) AS m" +
      ' ON CONFLICT (address) DO UPDATE SET multiplier = EXCLUDED.multiplier RETURNING *',
    [
      JSON.stringify(
        lst.map((a) => {
          return { address: addressToBinary(a[0]), multiplier: a[1] }
        })
      ),
    ]
  )
  console.log(res.rows)
  await client.end()
  await readAssoc(lst.map((a) => a[0].toString()))
}

async function updateRate(kit: ContractKit) {
  const client = new Client({ database: 'blockscout' })
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

async function processClaims(address: string, data: string) {
  try {
    const lst: string[] = JSON.parse(data).claims
    lst.push(address)
    const client = new Client({ database: 'blockscout' })
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
  updateRate(kit)
  const accounts: AccountsWrapper = await kit.contracts.getAccounts()
  function getFromUrl(a: string, url: string) {
    http
      .get(url, (resp) => {
        let data = ''
        resp.on('data', (chunk) => (data += chunk))
        resp.on('end', () => processClaims(a, data))
      })
      .on('error', (err) => console.log('Error: ' + err.message))
  }
  lst.forEach(async (a) => {
    try {
      const url = await accounts.getMetadataURL(a)
      if (url == '') console.log('Empty URL', a)
      else getFromUrl(a, url)
    } catch (err) {
      console.error('Bad address', a, err.toString())
    }
  })
}
