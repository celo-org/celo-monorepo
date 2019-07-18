import BackButton from '@celo/react-components/components/BackButton'
import * as React from 'react'
import { navigateBack } from 'src/navigator/NavigationService'

export default function MobileBackButton() {
  return <BackButton navigateBack={navigateBack} />
}
