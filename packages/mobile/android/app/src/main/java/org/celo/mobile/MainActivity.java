package org.celo.mobile;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.ReactFragmentActivity;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.devio.rn.splashscreen.SplashScreen;

import java.util.Date;
import android.util.Log;

public class MainActivity extends ReactFragmentActivity implements ReactInstanceManager.ReactInstanceEventListener {

  Date appStartTimestamp;
  String data;
  ReactContext reactContext;

  /**
   * Returns the name of the main component registered from JavaScript. This is
   * used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "celo";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    appStartTimestamp = new Date();
    Intent intent = getIntent();
    data = intent.toUri(Intent.URI_INTENT_SCHEME);
    SplashScreen.show(this);
    super.onCreate(null);
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    if (reactContext != null) {
      DeviceEventManagerModule.RCTDeviceEventEmitter emitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
      emitter.emit("Namdebug", intent.toUri(Intent.URI_INTENT_SCHEME));
    }

  }

  @Override
  public void onResume() {
    super.onResume();
    getReactInstanceManager().addReactInstanceEventListener(this);
  }

  @Override
  public void onPause() {
    super.onPause();
    getReactInstanceManager().removeReactInstanceEventListener(this);
  }


  @Override
  public void onReactContextInitialized(ReactContext context) {
    reactContext = context;
    DeviceEventManagerModule.RCTDeviceEventEmitter emitter = context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

    emitter.emit("AppStartedLoading", appStartTimestamp.toString());
    if (data != null) {
      emitter.emit("Namdebug", data);
      data = null;
    }
  }
}
