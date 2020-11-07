import { NextApiRequest, NextApiResponse } from 'next'
import getAssets, { AssetSheet } from 'server/AssetBase'
import byMethod from 'server/byMethod'
import getEventKit, { Sheets } from 'server/EventKit'

const ACCEPTABLE = new Set(
  [
    AssetSheet.Icons,
    AssetSheet.Illustrations,
    AssetSheet.AbstractGraphics,
    Sheets.Planning,
  ].map((type) => type.toLowerCase())
)

async function get(req: NextApiRequest, res: NextApiResponse) {
  const type = req.query.asset
    .toString()
    .toLowerCase()
    .split('-')
    .join(' ')

  if (!ACCEPTABLE.has(type)) {
    throw new Error(
      'Invalid param; must be one of icons, illustrations, or abstract-graphics, or planning'
    )
  }
  if (type === Sheets.Planning.toLowerCase()) {
    const docs = await getEventKit(Sheets.Planning)
    res.json(docs)
  } else {
    const assets = await getAssets(type as AssetSheet)
    res.json(assets)
  }
}

export default byMethod({ getHandler: get })
