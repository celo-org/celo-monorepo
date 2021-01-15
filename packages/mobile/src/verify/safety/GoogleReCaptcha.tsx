import React from 'react'
import WebView from 'src/components/WebView'

interface Props {
  onMessage: (any: any) => void
  siteKey: string
  style: any
  url: string
  languageCode: string
}

const GoogleReCaptcha = ({ onMessage, siteKey, style, url, languageCode }: Props) => {
  const webViewContent = `
  <!DOCTYPE html>
  <html>
     <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <script src="https://recaptcha.google.com/recaptcha/api.js?explicit&hl=${languageCode ||
          'en'}"></script> 
        <script type="text/javascript"> 
           var onloadCallback = function() { };  
           var onDataCallback = function(response) { 
             window.ReactNativeWebView.postMessage(response);  
             setTimeout(function () {
               document.getElementById('captcha').style.display = 'none';
             }, 1500);
           };  
           var onCancel = function() {  
             window.ReactNativeWebView.postMessage("cancel"); 
             document.getElementById('captcha').style.display = 'none';
           }
           var onDataExpiredCallback = function(error) {  window.ReactNativeWebView.postMessage("expired"); };  
           var onDataErrorCallback = function(error) {  window.ReactNativeWebView.postMessage("error"); } 
        </script> 
     </head>
     <body>
        <div id="captcha" style="height: 100vh;">
           <div style="text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <div class="g-recaptcha" style="display: inline-block; height: auto;" 
                 data-sitekey="${siteKey}" data-callback="onDataCallback"  
                 data-expired-callback="onDataExpiredCallback"  
                 data-error-callback="onDataErrorCallback">
              </div>
           </div>
        </div>
     </body>
  </html>
`
  return (
    <WebView
      originWhitelist={['https://*']}
      mixedContentMode={'always'}
      onMessage={onMessage}
      javaScriptEnabled={true}
      automaticallyAdjustContentInsets={true}
      style={style}
      source={{
        html: webViewContent,
        baseUrl: `${url}`,
      }}
    />
  )
}

export default GoogleReCaptcha
