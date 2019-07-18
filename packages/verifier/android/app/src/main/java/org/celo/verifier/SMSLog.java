package org.celo.verifier;

import android.os.Parcel;
import android.os.Parcelable;

public class SMSLog implements Parcelable {
    public boolean smsSent;
    public String date;
    public String phoneNumber;
    public String messageId;

    protected SMSLog(Parcel in) {
        phoneNumber = in.readString();
        date = in.readString();
        messageId = in.readString();
        smsSent = in.readByte() != 0;
    }

    public SMSLog(boolean smsSent, String date, String phoneNumber, String messageId){
        this.smsSent = smsSent;
        this.date = date;
        this.phoneNumber = phoneNumber;
        this.messageId = messageId;
    }

    public static final Parcelable.Creator CREATOR = new Parcelable.Creator() {
        public SMSLog createFromParcel(Parcel in) {
            return new SMSLog(in);
        }

        public SMSLog[] newArray(int size) {
            return new SMSLog[size];
        }
    };

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(phoneNumber);
        dest.writeString(date);
        dest.writeString(messageId);
        dest.writeByte((byte) (smsSent ? 1 : 0));
    }

    @Override
    public int describeContents() {
        return 0;
    }
}
