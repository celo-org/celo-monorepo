package org.celo.verifier;

import java.util.Map;
import java.util.HashMap;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsManager;
import android.util.Log;

import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.DatabaseError;

/*
 * The only way to tell if an SMS actually sends or fails is by using an Android BroadcastReceiver.
 * See here for more details:
 * https://developer.android.com/reference/android/content/BroadcastReceiver
 *
 * This listens for the SMS_SENT intent via the AndroidManifest.xml. This intent will instantiate this
 * class SMS and call onReceive. This will tell us if the SMS was successfully sent or not.
 * */
public class SMSStatusBroadcastReceiver extends BroadcastReceiver {
    public static final String SMS_SENT_INTENT  = "SMS_SENT";
    public static final String MESSAGE_ID_KEY = "MESSAGE_ID_KEY";
    private static final String TAG = "SMSStatusBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent)
    {
        Bundle extras = intent.getExtras();
        String messageId = extras.getString(MESSAGE_ID_KEY);
        Log.d(TAG, "SMS_SENT_INTENT onReceive hit with code " + getResultCode() + " for messageId" + messageId);
        if (messageId == null) {
            Log.d(TAG, "No messageId included so exiting");
            return;
        }
        switch(getResultCode())
        {
            case Activity.RESULT_OK:
                Log.d(TAG, "SMS sent successfully");
                markMessageAsSent(messageId);
                break;
            case SmsManager.RESULT_ERROR_GENERIC_FAILURE:
            case SmsManager.RESULT_ERROR_NO_SERVICE:
            case SmsManager.RESULT_ERROR_NULL_PDU:
            case SmsManager.RESULT_ERROR_RADIO_OFF:
            default:
                Log.d(TAG, "A problem occured sending the SMS");
                break;
        }
    }

    private static void markMessageAsSent(final String messageId) {
        Log.d(TAG, "Attempting to mark message as sent for "  + messageId);

        // Prep Firebase resources
        FirebaseDatabase database = FirebaseDatabase.getInstance();
        String path = BuildConfig.DEFAULT_TESTNET + "/messages/" + messageId;
        Log.d(TAG, "Using message ref path " + path);
        DatabaseReference messageRef = database.getReference(path);

        Map<String, Object> updates = new HashMap<String, Object>();
        updates.put("/messageState/", MessageState.SENT.ordinal());
        updates.put("/finishTime/", System.currentTimeMillis());
        messageRef.updateChildren(updates,  
          new DatabaseReference.CompletionListener() {
          @Override
          public void onComplete(DatabaseError error, DatabaseReference ref) {
              if (error == null) {
                Log.d(TAG, "Message marked as sent:" + messageId);
              }
              else {
                Log.e(TAG, "Error marking message " + messageId + " as sent: " + error.getMessage() + " : " + error.getDetails());
              }
          }
        });
    }
}
