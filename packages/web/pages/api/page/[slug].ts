import { NextApiRequest, NextApiResponse } from 'next'
import byMethod from 'src/../server/byMethod'
import { getPageBySlug } from 'src/utils/contentful'

async function get(req: NextApiRequest, res: NextApiResponse) {
  try {
    const locale = 'en-US'
    const pageData = await getPageBySlug(req.query.slug as string, { locale })
    res.json(pageData)
  } catch (e) {
    res.status(404).json({ status: 404 })
  }
}

export default byMethod({ getHandler: get })
