import * as React from 'react'

interface State {
  isComplete: boolean
  isLoading: boolean
  form: FormState
  errors: string[]
}

type FormField = string

type FormState = Record<FormField, string>

interface ChildArguments {
  onSubmit: (any?: any) => Promise<void>
  onAltSubmit: () => boolean
  onInput: (any: any) => void
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

function findFormInParentTree(target) {
  if (target.reportValidity || target.tagName === 'FORM') {
    return target
  } else {
    return findFormInParentTree(target.parentNode)
  }
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
    this.state = { form: props.blankForm, isComplete: false, isLoading: false, errors: [] }
  }
  // think of this as browser native submit,
  // deprecating
  submit = async (event) => {
    event.preventDefault()
    const form = event.target.form || findFormInParentTree(event.target)
    // note this has a side effect of showing native html validations to form submitter
    if (form.reportValidity()) {
      this.postForm()
    }
  }

  postForm = async () => {
    this.setState({ isLoading: true })
    await postForm(this.props.route, this.form())
    this.setState({ isComplete: true, form: this.props.blankForm, isLoading: false })
  }

  validates = () => {
    if (!this.props.validateWith) {
      return true
    }

    const errors = this.props.validateWith(this.form())
    this.setState({ errors, isComplete: false, isLoading: false })
    return errors.length === 0
  }

  // this will become onSubmit when submit is removed
  altSubmit = () => {
    if (this.validates()) {
      this.postForm()
      return true
    }
    return false
  }

  form = () => {
    return { ...this.state.form }
  }

  onInput = ({ nativeEvent }) => {
    const { name, value } = nativeEvent.target
    this.clearError(name)
    this.updateForm(name, value)
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
      onSubmit: this.submit,
      onAltSubmit: this.altSubmit,
      onInput: this.onInput,
      onSelect: this.onSelect,
      formState: { ...this.state },
    })
  }
}
