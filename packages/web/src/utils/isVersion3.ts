import getConfig from 'next/config'

export default function isVersion3(): boolean {
  const { publicRuntimeConfig } = getConfig()
  return publicRuntimeConfig.V3 === true
}
