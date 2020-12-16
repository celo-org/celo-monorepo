export interface ContactPhoneNumber {
    label?: string;
    number?: string;
}
export interface MinimalContact {
    recordID: string;
    displayName?: string;
    phoneNumbers?: ContactPhoneNumber[];
    thumbnailPath?: string;
}
export declare const getContactPhoneNumber: (contact: MinimalContact) => string | null | undefined;
export declare function isContact(contactOrNumber: any): contactOrNumber is MinimalContact;
