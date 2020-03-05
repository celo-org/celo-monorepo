import { NextApiRequest, NextApiResponse } from 'next'
import getAllies from 'server/Alliance'
import respondToError from 'server/respondToError'

export default async function(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const assets = await getAllies()
      res.json(assets)
    } else {
      res.status(405)
    }
  } catch (e) {
    respondToError(res, e)
  }
}
