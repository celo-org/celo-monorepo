import getConfig from 'next/config'

import Error from 'next/error'
import FaucetPage from 'src/dev/FaucetPage'

const { publicRuntimeConfig } = getConfig()
export default (publicRuntimeConfig.FAUCET ? FaucetPage : () => <Error statusCode={404} />)
