import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { verifyAccountClaim } from '@celo/contractkit/lib/identity/claims/verify'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import Web3 from 'web3'

const GoogleSpreadsheet = require('google-spreadsheet')

export function normalizeAddress(a: string) {
  try {
    a = a.toLowerCase()
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

const LEADERBOARD_SHEET =
  process.env['LEADERBOARD_SHEET'] || '1HCs1LZv1BOB1v2bVlH4qNPnxVRlYVhQ7CKhkMibE4EY'
const LEADERBOARD_WEB3 = process.env['LEADERBOARD_WEB3'] || 'http://localhost:8545'

export async function readFromSheet(f: any) {
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
            arr[e.row].address = normalizeAddress(e.value)
          }
          if (e.col == 3) {
            arr[e.row].multiplier = e.numericValue
          }
        }
        let lst = Object.values(arr)
        checkAssoc(
          lst.filter((a: any) => !!a.address && a.multiplier !== 0).map((a: any) => a.address),
          f
        )
      }
    )
  })
}

export function dedup(lst: string[]): string[] {
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

async function checkAssoc(lst: string[], f: any) {
  const web3 = new Web3(LEADERBOARD_WEB3)
  const kit: ContractKit = newKitFromWeb3(web3)
  const accounts: AccountsWrapper = await kit.contracts.getAccounts()
  const data = await Promise.all(
    lst.map(async (a) => {
      try {
        const url = await accounts.getMetadataURL(a)
        console.log(a, 'has url', url)
        let metadata: IdentityMetadataWrapper
        if (url == '') metadata = IdentityMetadataWrapper.fromEmpty(a)
        else {
          try {
            metadata = await IdentityMetadataWrapper.fetchFromURL(url)
          } catch (err) {
            console.error('Error reading metadata', a, err.toString())
            metadata = IdentityMetadataWrapper.fromEmpty(a)
          }
        }
        return { address: a, claims: await getClaims(kit, a, metadata) }
      } catch (err) {
        console.error('Bad address', a, err.toString())
        return { address: a, claims: [a] }
      }
    })
  )
  f(kit, data)
}

export function put(obj: any, key: string, elem: string) {
  let lst = obj[key] || []
  lst.push(elem)
  obj[key] = lst
}
