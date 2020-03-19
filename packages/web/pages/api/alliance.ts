import { NextApiRequest, NextApiResponse } from 'next'
import getAllies from 'server/Alliance'
import respondError from 'server/respondError'

export default async function(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const assets = await getAllies()
      res.json(assets)
    } else {
      res.status(405)
    }
  } catch (e) {
    respondError(res, e)
  }
}
