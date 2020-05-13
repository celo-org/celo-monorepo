import { NextApiRequest, NextApiResponse } from 'next'
import byMethod from '../../server/byMethod'
import fetchMilestones from '../../server/fetchMilestones'

async function get(_: NextApiRequest, res: NextApiResponse) {
  const milestones = await fetchMilestones()
  res.json(milestones)
}

export default byMethod({ getHandler: get })
