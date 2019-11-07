import NetworkSpeed from 'network-speed'

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

async function getNetworkDownloadSpeed() {
  const testNetworkSpeed = new NetworkSpeed()
  const baseUrl = 'http://httpbin.org/bytes/10000000'
  const fileSize = 100000
  const speed: Speeds = await testNetworkSpeed.checkDownloadSpeed(baseUrl, fileSize)
  return isFast(Number(speed.mbps))
}

const MIN_MB_FOR_FAST = 3

async function isFast(speed: number | EffectiveTypes) {
  if (speed === EffectiveTypes['4g']) {
    return true
  }
  if (typeof speed === 'number' && speed > MIN_MB_FOR_FAST) {
    return true
  }
  return false
}

function getEffectiveConnection(navigator): EffectiveTypes {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  return (connection && connection.effectiveType) || 'unknown'
}

// from http://wicg.github.io/netinfo/#dom-effectiveconnectiontype-slow-2g
enum EffectiveTypes {
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

  return Promise.race([getNetworkDownloadSpeed(), abort()])
}

const MAX_TIME_MS = 3000

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
  // @ts-ignore
  return navigator.deviceMemory || 4
}
