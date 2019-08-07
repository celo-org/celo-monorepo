package org.celo.mobile;

import android.os.Bundle;

import com.facebook.react.ReactFragmentActivity;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.devio.rn.splashscreen.SplashScreen;

import java.util.Date;

public class MainActivity extends ReactFragmentActivity implements ReactInstanceManager.ReactInstanceEventListener {

  Date appStartTimestamp;

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
    SplashScreen.show(this);
    super.onCreate(null);
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
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("AppStartedLoading", appStartTimestamp.toString());
  }
}
