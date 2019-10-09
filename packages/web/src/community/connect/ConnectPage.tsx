import * as React from 'react'
import { View } from 'react-native'
import CoverArea from 'src/community/connect/CoverArea'
import Tenets from 'src/community/connect/Tenets'
import EventData from 'src/events/EventsData'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import ArticleData from './ArticleData'

import Contribute from 'src/community/connect/Contribute'
import ConnectionFooter from 'src/shared/ConnectionFooter'

const preview = require('src/community/connect/preview.jpg')

type Props = I18nProps

// only send used translations to the client
const NAME_SPACES = ['common', 'community']

export class ConnectPage extends React.Component<Props> {
  // This is Next.js method that runs serverside. it is only available on page components
  static getInitialProps = () => {
    return {
      namespacesRequired: NAME_SPACES,
    }
  }

  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph
          path="/community"
          title={t('pageTitle')}
          description={
            'Celo is building a monetary system that allows more people to participate, and we invite you to join the conversation and our community. Diverse perspectives and inclusive conversations welcomed.'
          }
          image={preview}
        />
        <View>
          <CoverArea />
          <EventData />
          <Contribute />
          <ArticleData />
          <Tenets />
          <ConnectionFooter />
        </View>
      </>
    )
  }
}

export default withNamespaces(NameSpaces.community)(ConnectPage)
