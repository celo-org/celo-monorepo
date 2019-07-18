package org.celo.verifier;

import android.util.Log;
import android.os.Bundle;
import android.content.Intent;
import com.google.firebase.iid.FirebaseInstanceId;
import org.devio.rn.splashscreen.SplashScreen;
import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {

    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.show(this);
        super.onCreate(savedInstanceState);

        try {
            String firebaseDeviceToken  = FirebaseInstanceId.getInstance().getToken();
            Log.d(TAG,"Firebase token being used is: " + firebaseDeviceToken);
        } catch (Exception e) {
            String test = e.getMessage();
            Log.d(TAG,"Error " + test);
        }
    }
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "verifier";
    }

    /**
     * This fixes the following bug:
     * https://stackoverflow.com/questions/14853327/intent-not-restored-correctly-after-activity-is-killed-if-clear-top-and-single-t/18307360#18307360
     */
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        /*
         * This overrides the original intent.
         */
        setIntent(intent);
    }

}
