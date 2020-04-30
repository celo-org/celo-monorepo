import * as React from 'react'
import { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native'
import { ErrorKeys } from 'src/forms/ErrorDisplay'
interface State {
  isComplete: boolean
  isLoading: boolean
  form: FormState
  errors: string[]
  apiError?: ErrorKeys
}

type FormField = string

type FormState = Record<FormField, any>

interface NativeEvent {
  target: { name: string; value: string | boolean }
}

interface ChildArguments {
  onSubmit: (any?: any) => Promise<void>
  onInput: (event: NativeSyntheticEvent<TextInputChangeEventData>) => void
  onCheck: (event: { nativeEvent: NativeEvent }) => void
  onSelect: (key: string) => (event) => void
  formState: State
}

interface Props {
  route: string
  blankForm: FormState
  validateWith?: (form: FormState) => string[]
  children: (methods: ChildArguments) => React.ReactNode
}

export function postForm(route: string, formData: FormState) {
  return fetch(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
}

export function emailIsValid(email: string) {
  return email && email.length && email.length < 254 && email.indexOf('@') > 0
}

export function hasField(value: string) {
  return value && value.trim().length > 0
}

export default class Form extends React.Component<Props, State> {
  state: State
  constructor(props, context) {
    super(props, context)
    this.state = {
      form: props.blankForm,
      isComplete: false,
      isLoading: false,
      errors: [],
    }
  }

  postForm = async () => {
    this.setState({ isLoading: true })
    const response = await postForm(this.props.route, this.form())
    const apiError =
      response.status === 429
        ? ErrorKeys.pleaseWait
        : !response.ok
        ? ErrorKeys.unknownError
        : undefined
    this.setState({
      isComplete: response.ok,
      form: response.ok ? this.props.blankForm : this.state.form,
      isLoading: false,
      errors: [],
      apiError,
    })
  }

  validates = () => {
    if (!this.props.validateWith) {
      return true
    }

    const errors = this.props.validateWith(this.form())
    this.setState({ errors, isComplete: false, isLoading: false })
    return errors.length === 0
  }

  onSubmit = () => {
    if (this.validates()) {
      return this.postForm()
    }
  }

  form = () => {
    return { ...this.state.form }
  }

  onInput = ({ nativeEvent }) => {
    const { name, value } = nativeEvent.target
    this.clearError(name)
    this.updateForm(name, value)
  }

  onCheck = ({ nativeEvent }) => {
    const field = nativeEvent.target.name || nativeEvent.target.htmlFor
    this.updateForm(field, !this.state.form[field])
  }

  clearError = (field: string) => {
    this.setState((state) => {
      return { ...state, errors: state.errors.filter((error) => error !== field) }
    })
  }

  onSelect = (key) => (event: { target: { value: string } }) => {
    this.updateForm(key, event.target.value)
  }

  updateForm = (key, value) => {
    this.setState((state) => ({
      ...state,
      isComplete: false,
      form: { ...state.form, [key]: value },
    }))
  }

  render() {
    return this.props.children({
      onSubmit: this.onSubmit,
      onInput: this.onInput,
      onCheck: this.onCheck,
      onSelect: this.onSelect,
      formState: { ...this.state },
    })
  }
}
