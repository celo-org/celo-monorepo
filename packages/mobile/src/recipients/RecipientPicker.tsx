import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import SectionHead from '@celo/react-components/components/SectionHead'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
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
import { SafeAreaConsumer } from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { Namespaces, withTranslation } from 'src/i18n'
import { AddressToE164NumberType } from 'src/identity/reducer'
import {
  getRecipientFromAddress,
  NumberToRecipient,
  Recipient,
  RecipientKind,
  RecipientWithAddress,
  RecipientWithMobileNumber,
} from 'src/recipients/recipient'
import RecipientItem from 'src/recipients/RecipientItem'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { assertUnreachable } from 'src/utils/typescript'

interface Section {
  key: string
  data: Recipient[]
}

interface Props {
  testID?: string
  searchQuery: string
  sections: Section[]
  defaultCountryCode: string
  listHeaderComponent?: React.ComponentType<any>
  onSelectRecipient(recipient: Recipient): void
}

interface StateProps {
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

type RecipientProps = Props & WithTranslation & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  addressToE164Number: state.identity.addressToE164Number,
  recipientCache: recipientCacheSelector(state),
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
    switch (item.kind) {
      case RecipientKind.Contact:
        return item.contactId + item.phoneNumberLabel + index
      case RecipientKind.MobileNumber:
        return item.e164PhoneNumber + index
      case RecipientKind.QrCode:
        return item.address + index
      case RecipientKind.Address:
        return item.address + index
      default:
        Logger.error('RecipientPicker', 'Unsupported recipient kind', item)
        throw assertUnreachable(item)
    }
  }

  renderItemSeparator = () => <View style={style.separator} />

  renderEmptyView = () => {
    const parsedNumber = parsePhoneNumber(this.props.searchQuery, this.props.defaultCountryCode)
    if (parsedNumber) {
      return this.renderSendToPhoneNumber(parsedNumber.displayNumber, parsedNumber.e164Number)
    }
    if (isValidAddress(this.props.searchQuery)) {
      return this.renderSendToAddress()
    }
    return this.renderNoContentEmptyView()
  }

  renderNoContentEmptyView = () => (
    <View style={style.emptyView}>
      {this.props.searchQuery !== '' ? (
        <>
          <View style={style.emptyViewBody}>
            <Text style={fontStyles.body}>{this.props.t('noResultsFor')}</Text>
            <Text style={[fontStyles.body, style.emptyViewBodyDark]}>
              {` "${this.props.searchQuery}"`}
            </Text>
          </View>
          <Text style={[fontStyles.subSmall, style.footer]}>
            {this.props.t('searchForSomeone')}
          </Text>
        </>
      ) : (
        <View style={style.emptyViewBody}>
          <Text style={fontStyles.body}>{this.props.t('noContacts')}</Text>
        </View>
      )}
    </View>
  )

  renderSendToPhoneNumber = (displayId: string, e164PhoneNumber: string) => {
    const { t, onSelectRecipient } = this.props
    const recipient: RecipientWithMobileNumber = {
      kind: RecipientKind.MobileNumber,
      displayName: t('mobileNumber'),
      displayId,
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
    const { t, searchQuery, addressToE164Number, recipientCache, onSelectRecipient } = this.props
    const existingContact = getRecipientFromAddress(
      searchQuery,
      addressToE164Number,
      recipientCache
    )
    if (existingContact) {
      return (
        <>
          <RecipientItem recipient={existingContact} onSelectRecipient={onSelectRecipient} />
          {this.renderItemSeparator()}
        </>
      )
    } else {
      const recipient: RecipientWithAddress = {
        kind: RecipientKind.Address,
        displayName: t('walletAddress'),
        displayId: searchQuery.substring(2, 17) + '...',
        address: searchQuery,
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
      <View style={style.body} testID={this.props.testID}>
        <SafeAreaConsumer>
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
        </SafeAreaConsumer>
        <KeyboardSpacer onToggle={this.onToggleKeyboard} />
      </View>
    )
  }
}

const style = StyleSheet.create({
  body: {
    flex: 1,
  },
  separator: {
    backgroundColor: colors.darkLightest,
    height: 1,
    marginLeft: 60,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 50,
  },
  emptyView: {
    paddingHorizontal: 50,
    justifyContent: 'center',
  },
  emptyViewBody: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    textAlign: 'center',
  },
  emptyViewBodyDark: {
    color: colors.dark,
  },
  emptyViewBodySmall: {
    justifyContent: 'center',
    textAlign: 'center',
  },
})

export default connect(mapStateToProps, {})(withTranslation(Namespaces.sendFlow7)(RecipientPicker))
