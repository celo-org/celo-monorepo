import ErrorPage from 'pages/_error'
import Alliance from 'src/alliance/Main'
import { isAfterPubTime } from 'src/shared/menu-items'

const result = isAfterPubTime() ? Alliance : ErrorPage

export default result
