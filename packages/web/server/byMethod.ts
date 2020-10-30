import { NextApiRequest, NextApiResponse } from 'next'
import respondError from 'server/respondError'

type MethodHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>

interface Methods {
  getHandler?: MethodHandler
  postHandler?: MethodHandler
}

export default function byMethod({ getHandler, postHandler }: Methods) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      if (req.method === 'GET' && getHandler) {
        await getHandler(req, res)
      } else if (req.method === 'POST' && postHandler) {
        await postHandler(req, res)
      } else {
        res.status(405)
      }
    } catch (e) {
      respondError(res, e)
    }
  }
}
