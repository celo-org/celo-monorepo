import { NextApiRequest, NextApiResponse } from 'next'
import respondError from 'server/respondError'

export default async function(_: NextApiRequest, res: NextApiResponse) {
  try {
    res.write(Buffer.alloc(300, 'Celo is '))
    res.end()
  } catch (e) {
    respondError(res, e)
  }
}
