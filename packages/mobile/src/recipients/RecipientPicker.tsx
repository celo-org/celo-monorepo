import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import SectionHead from '@celo/react-components/components/SectionHead'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { isValidAddress } from '@celo/utils/src/address'
import { parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  ListRenderItemInfo,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { Namespaces, withTranslation } from 'src/i18n'
import {
  AddressRecipient,
  getRecipientFromAddress,
  MobileRecipient,
  Recipient,
  recipientHasContact,
  recipientHasNumber,
  RecipientInfo,
} from 'src/recipients/recipient'
import RecipientItem from 'src/recipients/RecipientItem'
import { RootState } from 'src/redux/reducers'

interface Section {
  key: string
  data: Recipient[]
}

interface Props {
  testID?: string
  searchQuery: string
  sections: Section[]
  defaultCountryCode: string | null
  listHeaderComponent?: React.ComponentType<any>
  onSelectRecipient(recipient: Recipient): void
}

interface StateProps {
  recipientInfo: RecipientInfo
}

type RecipientProps = Props & WithTranslation & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  recipientInfo: {
    addressToE164Number: state.identity.addressToE164Number,
    phoneRecipientCache: state.recipients.phoneRecipientCache,
    valoraRecipientCache: state.recipients.valoraRecipientCache,
    addressToDisplayName: state.identity.addressToDisplayName,
  },
})

export class RecipientPicker extends React.Component<RecipientProps> {
  state = {
    keyboardVisible: false,
  }

  onToggleKeyboard = (visible: boolean) => {
    this.setState({ keyboardVisible: visible })
  }

  renderItem = ({ item, index }: ListRenderItemInfo<Recipient>) => (
    <RecipientItem recipient={item} onSelectRecipient={this.props.onSelectRecipient} />
  )

  renderSectionHeader = (info: { section: SectionListData<Recipient> }) => (
    <SectionHead text={info.section.key as string} />
  )

  keyExtractor = (item: Recipient, index: number) => {
    if (recipientHasContact(item)) {
      return item.contactId + item.e164PhoneNumber + index
    } else if (recipientHasNumber(item)) {
      return item.e164PhoneNumber + index
    } else {
      return item.address + index
    }
  }

  renderItemSeparator = () => <View style={styles.separator} />

  renderEmptyView = () => {
    const parsedNumber = parsePhoneNumber(
      this.props.searchQuery,
      this.props.defaultCountryCode ? this.props.defaultCountryCode : undefined
    )
    if (parsedNumber) {
      return this.renderSendToPhoneNumber(parsedNumber.displayNumber, parsedNumber.e164Number)
    }
    if (isValidAddress(this.props.searchQuery)) {
      return this.renderSendToAddress()
    }
    return this.renderNoContentEmptyView()
  }

  renderNoContentEmptyView = () => (
    <View style={styles.emptyView}>
      {this.props.searchQuery !== '' ? (
        <>
          <View style={styles.emptyViewBody}>
            <Text style={fontStyles.emptyState}>
              {this.props.t('noResultsFor')}
              <Text style={fontStyles.emptyState}>{` "${this.props.searchQuery}"`}</Text>
            </Text>
            <Text style={styles.emptyStateBody}>{this.props.t('searchForSomeone')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyViewBody}>
          <Text style={fontStyles.emptyState}>{this.props.t('noContacts')}</Text>
        </View>
      )}
    </View>
  )

  renderSendToPhoneNumber = (displayNumber: string, e164PhoneNumber: string) => {
    const { t, onSelectRecipient } = this.props
    const recipient: MobileRecipient = {
      displayNumber,
      e164PhoneNumber,
    }
    return (
      <>
        <RecipientItem recipient={recipient} onSelectRecipient={onSelectRecipient} />
        {this.renderItemSeparator()}
      </>
    )
  }

  renderSendToAddress = () => {
    const { t, searchQuery, recipientInfo, onSelectRecipient } = this.props
    const searchedAddress = searchQuery.toLowerCase()
    const existingContact = getRecipientFromAddress(searchedAddress, recipientInfo)
    if (existingContact) {
      return (
        <>
          <RecipientItem recipient={existingContact} onSelectRecipient={onSelectRecipient} />
          {this.renderItemSeparator()}
        </>
      )
    } else {
      const recipient: AddressRecipient = {
        address: searchedAddress,
      }

      return (
        <>
          <RecipientItem recipient={recipient} onSelectRecipient={onSelectRecipient} />
          {this.renderItemSeparator()}
        </>
      )
    }
  }

  render() {
    const { sections, listHeaderComponent } = this.props

    return (
      <View style={styles.body} testID={this.props.testID}>
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <SectionList
              // Note: contentInsetAdjustmentBehavior="always" would be simpler
              // but leaves an incorrect top offset for the scroll bar after hiding the keyboard
              // so here we manually adjust the padding
              contentContainerStyle={
                !this.state.keyboardVisible &&
                insets && {
                  paddingBottom: insets.bottom,
                }
              }
              renderItem={this.renderItem}
              renderSectionHeader={this.renderSectionHeader}
              sections={sections}
              ItemSeparatorComponent={this.renderItemSeparator}
              ListHeaderComponent={listHeaderComponent}
              ListEmptyComponent={this.renderEmptyView()}
              keyExtractor={this.keyExtractor}
              initialNumToRender={30}
              keyboardShouldPersistTaps="always"
            />
          )}
        </SafeAreaInsetsContext.Consumer>
        <KeyboardSpacer onToggle={this.onToggleKeyboard} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  separator: {},
  emptyStateBody: {
    ...fontStyles.regular,
    color: colors.gray3,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyView: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  emptyViewBody: {
    justifyContent: 'center',
    paddingVertical: 24,
    textAlign: 'center',
  },
})

export default connect(
  mapStateToProps,
  {}
)(withTranslation<RecipientProps>(Namespaces.sendFlow7)(RecipientPicker))
