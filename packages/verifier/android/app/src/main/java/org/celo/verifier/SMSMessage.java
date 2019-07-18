package org.celo.verifier;

import com.google.firebase.database.IgnoreExtraProperties;

@IgnoreExtraProperties
public class SMSMessage {
    public String phoneNum;
    public String address;
    public String message;
    public String verifierId;
    public String verifierCandidates;
    public long startTime;
    public long finishTime;
    public int messageState;

    public SMSMessage() {
        // Default constructor required for calls to DataSnapshot.getValue(User.class)
    }
}
