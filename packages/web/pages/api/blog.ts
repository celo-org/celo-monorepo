import { NextApiRequest, NextApiResponse } from 'next'
import { getFormattedMediumArticles } from 'server/mediumAPI'

import respondError from 'server/respondError'

export default async function(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const articlesdata = await getFormattedMediumArticles(req.query.tagged as string)
      res.json(articlesdata)
    } else {
      res.status(405)
    }
  } catch (e) {
    respondError(res, e)
  }
}
