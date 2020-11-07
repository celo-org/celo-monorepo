import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Modal from 'src/components/Modal'

interface Props {
  image?: ImageSourcePropType
  title: string | React.ReactNode
  children: React.ReactNode
  actionText: string
  actionPress: () => void
  secondaryActionText?: string
  secondaryActionDisabled?: boolean
  secondaryActionPress?: () => void
  isVisible: boolean
  showLoading?: boolean
  testID?: string
}

export default function Dialog({
  title,
  children,
  actionPress,
  actionText,
  secondaryActionText,
  secondaryActionDisabled,
  secondaryActionPress,
  showLoading = false,
  image,
  isVisible,
  testID,
}: Props) {
  return (
    <Modal isVisible={isVisible}>
      <ScrollView contentContainerStyle={styles.root}>
        {image && <Image style={styles.imageContainer} source={image} resizeMode="contain" />}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{children}</Text>
      </ScrollView>
      <View style={styles.actions}>
        {secondaryActionText && (
          <TextButton
            style={styles.secondary}
            disabled={secondaryActionDisabled}
            onPress={secondaryActionPress}
            testID={testID && `${testID}/SecondaryAction`}
          >
            {secondaryActionText}
          </TextButton>
        )}
        {showLoading ? (
          <ActivityIndicator style={styles.primary} size="small" color={colors.greenUI} />
        ) : (
          <TextButton
            style={styles.primary}
            onPress={actionPress}
            testID={testID && `${testID}/PrimaryAction`}
          >
            {actionText}
          </TextButton>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    ...fontStyles.h2,
  },
  body: {
    textAlign: 'center',
    ...fontStyles.regular,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  secondary: {
    color: colors.gray4,
    paddingTop: 16,
  },
  primary: {
    paddingTop: 16,
  },
  imageContainer: {
    marginBottom: 12,
    width: 100,
    height: 100,
  },
})
