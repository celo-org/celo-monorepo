import { getErrorMessage } from '@celo/utils/src/displayFormatting'
import * as React from 'react'
import { WithTranslation, withTranslation } from 'react-i18next'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import ErrorScreen from 'src/shared/ErrorScreen'

interface State {
  childError: Error | null
}

interface OwnProps {
  children: any
}

type Props = OwnProps & WithTranslation

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    childError: null,
  }

  componentDidCatch(error: Error, info: any) {
    this.setState({ childError: error })
    CeloAnalytics.track(DefaultEventNames.errorDisplayed, { error }, true)
  }

  render() {
    const { childError } = this.state
    if (childError) {
      return <ErrorScreen errorMessage={getErrorMessage(childError)} />
    }

    return this.props.children
  }
}

export default withTranslation()(ErrorBoundary)
