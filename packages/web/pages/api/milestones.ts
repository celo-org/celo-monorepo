import { NextApiRequest, NextApiResponse } from 'next'
import byMethod from '../../server/byMethod'
import fetchMilestones from '../../server/fetchMilestones'

async function get(_: NextApiRequest, res: NextApiResponse) {
  try {
    const milestones = await fetchMilestones()
    res.json(milestones)
  } catch {
    res.status(500).json([])
  }
}

export default byMethod({ getHandler: get })
