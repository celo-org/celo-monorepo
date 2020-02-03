import { dedup, put } from './util'
import { Client } from 'pg'

const LEADERBOARD_DATABASE = process.env['LEADERBOARD_DATABASE'] || 'blockscout'

const client = new Client({ database: LEADERBOARD_DATABASE })

/*
select json_agg(t) from (select distinct on (address, to_address_hash) address, to_address_hash from transactions, claims where from_address_hash = claimed_address) as t \g tr.json

select json_agg(t) from (select distinct on (address, third_topic) address, decode(substring(third_topic from 27), 'hex') as to from logs, claims where first_topic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' and second_topic = '0x000000000000000000000000' || encode(claimed_address::bytea, 'hex') order by address, third_topic) as t \g token.json

\t on
\pset format unaligned

select json_agg(t) from (select distinct on (from_address_hash, to_address_hash) from_address_hash, to_address_hash from transactions) as t \g all_tr.json
select json_agg(t) from (select address, claimed_address from claims) t \g claim.json

select json_agg(t) from (select distinct on (second_topic, third_topic) decode(substring(second_topic from 27), 'hex') as from, decode(substring(third_topic from 27), 'hex') as to from logs where first_topic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' order by second_topic, third_topic) as t \g all_token.json

*/

function iter(obj: any, a: string) {
  let last = [a]
  let len = 1
  while (true) {
    let lst = last.concat()
    last.forEach((a) => (lst = lst.concat(obj[a] || [])))
    last = dedup(lst)
    if (last.length == len) break
    len = last.length
  }
  return last
}

function transitive(obj: any) {
  let res: any = {}
  Object.keys(obj).forEach((key) => (res[key] = iter(obj, key)))
  return res
}

function histogram(obj: any) {
  let entries: [string, string[]][] = Object.entries(obj)
  entries.forEach(([a, lst]) => console.log(a, dedup(lst).length))
}

function sinks(obj: any) {
  let entries: [string, string[]][] = Object.entries(obj)
  return entries.filter(([_, lst]) => dedup(lst).length > 6).map(([a, _]) => a)
}

function relClaims(obj: any, claims: any, _claims1: any) {
  let entries: [string, string[]][] = Object.entries(obj)
  let res: any = {}
  entries.forEach(([a, lst]) =>
    lst.forEach((b) => {
      claims[a] && claims[b] && put(res, claims[a][0], claims[b][0])
    })
  )
  console.log(Object.keys(res).length)
  return res
}

async function readClaims() {
  let claims_json = await client.query(
    `select json_agg(t) from (select address, claimed_address from claims) t`
  )
  let claims = claims_json.rows[0].json_agg
  let obj1: any = {}
  let obj2: any = {}
  function add(key: string, elem: string) {
    put(obj1, key, elem)
    put(obj1, key, key)
    put(obj2, key, key)
    put(obj2, elem, key)
  }
  claims.map((a: any) => add(a.address.substr(2), a.claimed_address.substr(2)))
  console.log(Object.keys(obj1).length, Object.keys(obj2).length)
  return [obj2, obj1]
}

function removeNodes(obj: any, nodes: string[]) {
  let entries: [string, string[]][] = Object.entries(obj)
  let res: any = {}
  entries.forEach(([a, lst]) =>
    lst.forEach((b) => {
      !nodes.includes(a) && !nodes.includes(b) && put(res, a, b)
    })
  )
  return res
}

export async function readData() {
  await client.connect()
  let tokens = (
    await client.query(
      `select json_agg(t) from (select distinct on (second_topic, third_topic) decode(substring(second_topic from 27), 'hex') as from, decode(substring(third_topic from 27), 'hex') as to from logs where first_topic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' order by second_topic, third_topic) as t`
    )
  ).rows[0].json_agg
  let tr = (
    await client.query(
      `select json_agg(t) from (select distinct on (from_address_hash, to_address_hash) from_address_hash, to_address_hash from transactions) as t`
    )
  ).rows[0].json_agg
  let [claims, claims1] = await readClaims()
  let obj1: any = {}
  let obj2: any = {}
  function add(key: string, elem: string) {
    put(obj1, key, elem)
    put(obj2, elem, key)
  }
  tokens.map((a: any) => add(a.from.substr(2), a.to.substr(2)))
  tr.map((a: any) => {
    if (!a.from_address_hash || !a.to_address_hash) return
    add(a.from_address_hash.substr(2), a.to_address_hash.substr(2))
  })
  console.log('Find sinks (contracts)')
  histogram(obj2)
  let lst = sinks(obj2)
  console.log(lst)
  // Remove sinks from obj1 and obj2
  obj1 = removeNodes(obj1, lst)
  obj2 = removeNodes(obj2, lst)
  console.log('Sources for addresses:')
  histogram(transitive(obj2))
  console.log('Entanglements between competitors')
  histogram(relClaims(transitive(obj1), claims, claims1))
  console.log('Entanglements between competitors (other direction, why are these different?)')
  histogram(relClaims(transitive(obj2), claims, claims1))
  client.end()
}

/* contract addresses
  
  [ 'c8fd77490a12f46709bffbcc0fce35740da8d860',
    '1726428a6d575fdc9c7c3b7bac9f2247a5649bf2',
    '5c7197e1147ebf98658a2a8bc3d32bebf1692829',
    '62492a644a588fd904270bed06ad52b9abfea1ae',
    '7c08fec4da47ebece57de73204bd632ddac91027',
    '918919436bba96e2c80ca22405aaba075e2ac82e',
    'e8e4969649330b25c13a36f977487084b92a7466',
    '14d449ef428e679da48b3e8cffa9036ff404b28a' ]
  */

readData()
