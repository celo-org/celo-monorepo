import Form from 'src/forms/Form'
import { View } from 'react-native'

export default function CollectiveForm() {
  return (
    <Form route="/" blankForm={{ name: '', email: '', info: '', subscribe: '' }}>
      {() => <View />}
    </Form>
  )
}
