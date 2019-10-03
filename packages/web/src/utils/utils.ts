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

export function getEffectiveConnection(navigator): EffectiveTypes {
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

export const SLOW_CONNECTIONS = new Set([
  EffectiveTypes['2g'],
  EffectiveTypes['slow-2g'],
  EffectiveTypes['3g'],
])
