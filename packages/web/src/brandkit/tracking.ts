import analytics from 'src/analytics/analytics'
export enum AssetTypes {
  logo = 'logo',
  icon = 'icon',
  font = 'font',
  illustration = 'illustration',
  graphic = 'graphic',
}

export const GLYPH_TRACKING = { name: 'Celo Glyphs', type: AssetTypes.logo }

export const JOST_TRACKING = { name: 'Jost', type: AssetTypes.font }

export const GARMOND_TRACKING = { name: 'Garmond', type: AssetTypes.font }

export async function trackDownloads({ name, type }) {
  await analytics.track(`${name} Downloaded`, { assetType: type, scope: 'brand-kit' })
}
