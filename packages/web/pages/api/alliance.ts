import { NextApiRequest, NextApiResponse } from 'next'
import getAllies from 'server/Alliance'
import respondError from 'server/respondError'

export default async function(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const allies = await getAllies()
      res.json(allies.filter((ally) => ally.records.length > 0))
    } else {
      res.status(405)
    }
  } catch (e) {
    respondError(res, e)
  }
}
