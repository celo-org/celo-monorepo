import fs from 'fs'
import 'isomorphic-fetch'
import path from 'path'
import { Timezone } from '../src/utils/timezone'

const TZ_URL = 'https://data.iana.org/time-zones/tzdb/zone.tab'
const OUTPUT_PATH = path.normalize(path.join(__dirname, '..', 'src', 'utils', 'timezones.json'))

// Parse a latitude coordinate as encoded in the zone.tab file.
function parseLatitude(lat: string): number {
  const match = lat.match(/^([+-])(\d{2})(\d{2})(\d{2})?/)
  if (!match) {
    throw new Error(`Cannot parse ${lat} as latitude`)
  }
  const [sign, degrees, minutes, seconds] = match.slice(1)
  return Number(sign + '1') * (Number(degrees) + Number(minutes) / 60 + Number(seconds ?? 0) / 60)
}

// Parse a longitude coordinate as encoded in the zone.tab file.
function parseLongitude(lon: string): number {
  const match = lon.match(/^([+-])(\d{3})(\d{2})(\d{2})?/)
  if (!match) {
    throw new Error(`Cannot parse ${lon} as longitude`)
  }
  const [sign, degrees, minutes, seconds] = match.slice(1)
  return Number(sign + '1') * (Number(degrees) + Number(minutes) / 60 + Number(seconds ?? 0) / 60)
}

async function main() {
  console.info(`Fetching timzone table from ${TZ_URL}`)
  const resp = await fetch(TZ_URL)
  if (!resp.ok) {
    throw new Error(`Got HTTP error code ${resp.status}: ${resp.statusText}`)
  }

  const timestamp = resp.headers.get('Last-Modified')
  if (timestamp) {
    console.info(`Last modified ${timestamp}`)
  }

  // Parse the text into a table.
  const text = await resp.text()
  const table = text
    .split(/\r?\n/)
    .filter((line) => !line.match(/^(#|\s*$)/))
    .map((line) => line.split('\t'))

  // Parse the table into a list of timezone objects.
  const zones: Timezone[] = table.map((row) => {
    const countryCodes = row[0].split(',')
    if (!countryCodes) {
      throw new Error(`Country codes undefined for timezone entry`)
    }

    //  Coordinates are in ISO 6709 sign-degrees-minutes-seconds format,
    //  either ±DDMM±DDDMM or ±DDMMSS±DDDMMSS,
    const coordinates = row[1].match(/^([+-]\d{4,6})([+-]\d{5,7})$/)?.slice(1)
    if (!coordinates) {
      throw new Error(`Could not parse ${row[1]} as coordinates`)
    }
    const [latitude, longitude] = [parseLatitude(coordinates[0]), parseLongitude(coordinates[1])]

    const [name, comments] = row.slice(2)
    if (!name) {
      throw new Error(`Name undefined for timezone entry`)
    }

    return {
      countryCodes,
      coordinates: {
        latitude,
        longitude,
      },
      name,
      comments,
    }
  })
  console.info(`Parsed ${zones.length} timezone entries`)

  // Produce a mapping of timezone names to objects.
  const mapping: { [name: string]: Timezone } = {}
  for (const zone of zones) {
    mapping[zone.name] = zone
  }

  console.info(`Writing output to ${OUTPUT_PATH}`)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping))
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
