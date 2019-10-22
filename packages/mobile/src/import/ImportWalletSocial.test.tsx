import Button from '@celo/react-components/components/Button'
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ImportWalletSocial, {
  ImportWalletSocial as ImportWalletSocialClass,
} from 'src/import/ImportWalletSocial'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockMnemonic, mockMnemonicShard1, mockMnemonicShard2 } from 'test/values'

jest.mock('src/geth/GethAwareButton', () => {
  return Button
})

describe('ImportWalletSocial', () => {
  it('renders correctly and is disabled with no text', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <ImportWalletSocial />
      </Provider>
    )

    expect(wrapper.toJSON()).toMatchSnapshot()
    expect(wrapper.queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
  })

  it('calls import with the mnemonic', () => {
    const importFn = jest.fn()

    const wrapper = render(
      <Provider store={createMockStore()}>
        <ImportWalletSocialClass
          importBackupPhrase={importFn}
          hideAlert={jest.fn()}
          isImportingWallet={false}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(wrapper.getByTestId('SocialBackupKeyInputField1'), mockMnemonicShard1)
    fireEvent.changeText(wrapper.getByTestId('SocialBackupKeyInputField2'), mockMnemonicShard2)
    fireEvent.press(wrapper.getByTestId('ImportWalletSocialButton'))
    expect(importFn).toHaveBeenCalledWith(mockMnemonic, false)
  })
})
