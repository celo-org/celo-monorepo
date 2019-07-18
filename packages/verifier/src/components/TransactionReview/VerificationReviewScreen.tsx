import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import { navigateBack } from '@celo/react-components/services/NavigationService'
import { Namespaces } from 'locales'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { NavigationInjectedProps } from 'react-navigation'
import VerificationConfirmationCard from 'src/components/TransactionReview/VerificationConfirmationCard'
import { getDatetimeDisplayString } from 'src/utils/formatting'

export interface NavigationPropsWrapper {
  reviewProps: ReviewProps
}

export interface ReviewProps {
  timestamp: number
  value: string
  phoneNumbers: string[]
}

type Props = NavigationInjectedProps<NavigationPropsWrapper> & WithNamespaces

export class VerificationReviewScreen extends React.PureComponent<Props> {
  static navigationOptions = { header: null }

  getNavigationProps = (): ReviewProps => {
    const { timestamp, value, phoneNumbers } = this.props.navigation.getParam('reviewProps')

    if (!timestamp || !value || !phoneNumbers) {
      throw new Error('Missing review props')
    }

    return {
      timestamp,
      value,
      phoneNumbers,
    }
  }

  renderHeader = () => {
    const { t, i18n } = this.props
    const { timestamp } = this.getNavigationProps()
    const dateTimeStatus = getDatetimeDisplayString(timestamp, t, i18n)
    return <ReviewHeader title={t('verifierReward')} subtitle={dateTimeStatus} />
  }

  render() {
    const { value, phoneNumbers } = this.getNavigationProps()
    return (
      <ReviewFrame HeaderComponent={this.renderHeader} navigateBack={navigateBack}>
        <VerificationConfirmationCard value={value} phoneNumbers={phoneNumbers} />
      </ReviewFrame>
    )
  }
}

export default withNamespaces(Namespaces.profile)(VerificationReviewScreen)
