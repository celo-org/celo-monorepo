import BackChevron, { Props as BackChevronProps } from '@celo/react-components/icons/BackChevron.v2'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton, TopBarIconButtonProps } from 'src/navigator/TopBarButton.v2'

type Props = Omit<TopBarIconButtonProps, 'icon'> & BackChevronProps

function BackButton(props: Props) {
  return (
    <View style={styles.container}>
      <TopBarIconButton
        {...props}
        icon={<BackChevron color={props.color} height={props.height} />}
      />
    </View>
  )
}

BackButton.defaultProps = {
  onPress: navigateBack,
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: variables.contentPadding + 6, // 6px from the left padding
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default BackButton
