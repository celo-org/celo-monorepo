import * as React from 'react'
import { View } from 'react-native'
import BackButton from 'src/components/BackButton'
import DisconnectBanner from 'src/shared/DisconnectBanner'

export const nuxNavigationOptions = {
  headerStyle: {
    elevation: 0,
  },
  headerLeftContainerStyle: { paddingHorizontal: 20 },
  headerLeft: <BackButton />,
  headerRightContainerStyle: { paddingRight: 15 },
  headerRight: (
    <View>
      <DisconnectBanner />
    </View>
  ),
}

export const nuxNavigationOptionsNoBackButton = {
  ...nuxNavigationOptions,
  headerLeft: null,
}
