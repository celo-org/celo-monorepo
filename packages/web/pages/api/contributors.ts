import { NextApiRequest, NextApiResponse } from 'next'
import getContributors from 'server/getContributors'
import respondError from 'server/respondError'

export default async function(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const assets = await getContributors()
      res.json(assets)
    } else {
      res.status(405)
    }
  } catch (e) {
    respondError(res, e)
  }
}
