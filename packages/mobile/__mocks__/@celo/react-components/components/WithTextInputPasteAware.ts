// Mocking this because the setInterval call is causing jest to hang
// Using fake timers hasn't helped
export default function withTextInputPasteAware(
  WrappedTextInput: any,
  pasteIconContainerStyle?: any
) {
  return WrappedTextInput
}
