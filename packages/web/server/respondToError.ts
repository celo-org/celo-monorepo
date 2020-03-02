interface Response {
  status: (code: number) => Response
  json: (jsonCompatible: object) => void
}

export default function respondToError(
  res: Response,
  error: { message: string; statusCode: number }
) {
  res.status(error.statusCode || 500).json({ message: error.message || 'unknownError' })
}
