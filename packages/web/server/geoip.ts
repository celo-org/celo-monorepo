import fetch from 'cross-fetch'
import getConfig from 'next/config'
import cache from './cache'

const COUNTRY_TTL = 1440 // 24 hours

// @returns uppercase 2 letter country code
export async function getCountryFromIP(ip: string) {
  const key = getConfig().serverRuntimeConfig.IPSTACK_KEY

  const geodata = await fetch(`http://api.ipstack.com/${ip}?access_key=${key}`)
  const data = await geodata.json()
  return data.country_code || ''
}

export async function getCountryFromIPCached(ipAddress: string) {
  return cache(`geo-${ipAddress}`, getCountryFromIP, {
    args: ipAddress,
    minutes: COUNTRY_TTL,
  })
}
