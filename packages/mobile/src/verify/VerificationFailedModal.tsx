import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'

interface OwnProps {
  isVisible: boolean
}

type Props = OwnProps & WithNamespaces

function VerificationFailedModal(props: Props) {
  const onSkip = () => {
    navigate(Stacks.AppStack)
  }

  return (
    <Modal isVisible={props.isVisible}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalHeader}>{props.t('failModal.header')}</Text>
        <Text style={fontStyles.body}>{props.t('failModal.body1')}</Text>
        <Text style={[fontStyles.body, componentStyles.marginTop10]}>
          {props.t('failModal.body2')}
        </Text>
        <View style={styles.modalButtonsContainer}>
          <TextButton onPress={onSkip} style={styles.modalSkipText}>
            {props.t('missingCodesModal.skip')}
          </TextButton>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    ...fontStyles.bold,
    marginVertical: 15,
    color: colors.errorRed,
  },
  modalButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalSkipText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
  },
})

export default withNamespaces(Namespaces.nuxVerification2)(VerificationFailedModal)
