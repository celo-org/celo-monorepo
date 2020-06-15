import analytics from 'src/analytics/analytics'
export enum AssetTypes {
  logo = 'logo',
  icon = 'icon',
  font = 'font',
  illustration = 'illustration',
  graphic = 'graphic',
}

interface Tracker {
  name: string
  type: AssetTypes
}

export const GLYPH_TRACKING: Tracker = { name: 'Celo Glyphs', type: AssetTypes.logo }

export const JOST_TRACKING: Tracker = { name: 'Jost', type: AssetTypes.font }

export const GARMOND_TRACKING: Tracker = { name: 'Garmond', type: AssetTypes.font }

export const LOGO_PKG_TRACKING: Tracker = { name: 'Logo Package', type: AssetTypes.logo }

export const EXCHANGE_ICONS_PKG_TRACKING: Tracker = {
  name: 'Exchange Icons Package',
  type: AssetTypes.icon,
}

export const VOICE_DOC_TRACKING: Tracker = { name: 'Celo Voice Doc', type: AssetTypes.logo }

export async function trackDownload({ name, type }: Tracker) {
  await analytics.track(`${name} Downloaded`, { assetType: type, scope: 'brand-kit' })
}
