export enum ScrollDirection {
  next = 'next',
  previous = 'previous',
}

export enum BackQuizProgress {
  word_chosen = 'word_chosen',
  backspace = 'backspace',
}

// Origin of Send actions
export enum SendOrigin {
  AppSendFlow = 'app_send_flow', // Sending as part of the app send flow
  AppRequestFlow = 'app_request_flow', // Sending because of a received payment request
  Bidali = 'bidali', // Sending from Bidali
}
