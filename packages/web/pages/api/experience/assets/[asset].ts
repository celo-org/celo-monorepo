import { NextApiRequest, NextApiResponse } from 'next'
import getAssets, { AssetSheet } from 'server/AssetBase'
import respondError from 'server/respondError'

const ACCEPTABLE = new Set(
  [AssetSheet.Icons, AssetSheet.Illustrations, AssetSheet.AbstractGraphics].map((type) =>
    type.toLowerCase()
  )
)

export default async function(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const type = req.query.asset
        .toString()
        .toLowerCase()
        .split('-')
        .join(' ')

      if (!ACCEPTABLE.has(type)) {
        throw new Error('Invalid param; must be one of icons, illustrations, or abstract-graphics')
      }
      const assets = await getAssets(type as AssetSheet)
      res.json(assets)
    } else {
      res.status(405)
    }
  } catch (e) {
    respondError(res, e)
  }
}
