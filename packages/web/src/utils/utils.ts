import NetworkSpeed from 'network-speed'
import { Clipboard } from 'react-native'

export function randomIntegerInRange(min: number, max: number) {
  return Math.round(Math.random() * (max - min + 1)) + min
}

export function scrollTo(elementID: string, position?: 'start' | 'center') {
  const element = document.getElementById(elementID)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: position,
      inline: position,
    })
  }
}

interface Speeds {
  mbps: string
  kbps: string
  bps: string
}

export async function getNetworkDownloadSpeed() {
  try {
    const testNetworkSpeed = new NetworkSpeed()
    const byteSize = 300
    const baseUrl = `/api/bytes`

    const speed: Speeds = await testNetworkSpeed.checkDownloadSpeed(baseUrl, byteSize)
    return speed
  } catch (e) {
    return { mbps: '0', kbps: '0', bps: '0' }
  }
}

const MIN_MB_FOR_FAST = 5

async function isFast(speed: number | EffectiveTypes) {
  if (speed === EffectiveTypes['4g']) {
    return true
  }
  if (typeof speed === 'number' && speed > MIN_MB_FOR_FAST) {
    return true
  }
  return false
}

export function getEffectiveConnection(navigator): EffectiveTypes {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  return (connection && connection.effectiveType) || 'unknown'
}

// from http://wicg.github.io/netinfo/#dom-effectiveconnectiontype-slow-2g
export enum EffectiveTypes {
  '2g' = '2g',
  '3g' = '3g',
  '4g' = '4g',
  'slow-2g' = 'slow-2g',
  'unknown' = 'unknown',
}

export async function hasGoodConnection() {
  const chromesBuiltInMethod = getEffectiveConnection(window.navigator)
  if (chromesBuiltInMethod !== 'unknown') {
    return isFast(chromesBuiltInMethod)
  }

  return Promise.race([multiPartCheck(), abort()])
}

async function multiPartCheck() {
  const multiPart = await Promise.all([getNetworkDownloadSpeed(), getNetworkDownloadSpeed()])

  const averageSpeed =
    multiPart
      .map((speeds) => speeds.mbps)
      .reduce((previous, current) => {
        return Number(previous) + Number(current)
      }, 0) / multiPart.length
  return isFast(averageSpeed)
}

const MAX_TIME_MS = 1000

async function abort(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(false)
    }, MAX_TIME_MS)
  })
}

type MemoryGB = 0.25 | 0.5 | 1 | 2 | 4 | 8

export function getDeviceMemory(): MemoryGB {
  // only available on chrome / android browser assume 4 if we dont know
  return (navigator.deviceMemory as MemoryGB) || 4
}

export function isBrowser() {
  return process.browser
}

export function cutAddress(address: string) {
  return address.toUpperCase().replace(/^0x([a-f0-9]{4}).+([a-f0-9]{4})$/i, '0x$1...$2')
}

export function formatNumber(n: number, decimals: number = 2) {
  if (n === Infinity) {
    return undefined as string
  }
  return isNaN(+n)
    ? (0).toFixed(decimals)
    : (+n).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function copyToClipboad(text: string) {
  Clipboard.setString(text)
}

export function weiToDecimal(number: number) {
  return number / 10 ** 18
}
