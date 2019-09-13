import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import { Namespaces } from 'src/i18n'

type Props = {
  isVisible: boolean
  title: string
  buttonText0?: string
  buttonText1?: string
  onPress0?: () => void
  onPress1?: () => void
  children?: React.ReactChild
} & WithNamespaces

const BackupModal = (props: Props) => {
  const { t, isVisible, title, onPress0, onPress1, buttonText0, buttonText1, children } = props
  const singleButton = (onPress0 && !!buttonText0) !== (onPress1 && !!buttonText1)

  return (
    <View style={styles.modalContainer}>
      <Modal isVisible={isVisible}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitleText, fontStyles.medium]}>{title}</Text>
          {children && <Text style={styles.modalContentText}>{children}</Text>}
          <View
            style={[
              styles.modalOptionsContainer,
              singleButton && styles.modalOptionsContainerSingle,
            ]}
          >
            {buttonText0 &&
              onPress0 && (
                <TouchableOpacity onPress={onPress0} style={styles.button}>
                  <Text style={[fontStyles.link, styles.button0]}>{buttonText0}</Text>
                </TouchableOpacity>
              )}
            {buttonText1 &&
              onPress1 && (
                <TouchableOpacity onPress={onPress1} style={styles.button}>
                  <Text style={fontStyles.link}>{buttonText1}</Text>
                </TouchableOpacity>
              )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    width: variables.width - 500,
  },
  modalTitleText: {
    marginTop: 20,
    color: colors.dark,
    fontSize: 18,
    paddingHorizontal: 30,
  },
  modalContentText: {
    marginTop: 20,
    color: colors.darkSecondary,
    fontSize: 16,
    paddingHorizontal: 30,
  },
  modalOptionsContainer: {
    marginLeft: 40,
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  modalOptionsContainerSingle: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  button: {
    padding: 20,
  },
  button0: {
    color: colors.dark,
  },
})

export default withNamespaces(Namespaces.backupKeyFlow6)(BackupModal)
