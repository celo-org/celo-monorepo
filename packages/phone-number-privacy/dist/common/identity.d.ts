/// <reference types="express" />
import { Request } from 'firebase-functions';
export declare function authenticateUser(request: Request): boolean;
export declare function isVerified(account: string, hashedPhoneNumber: string): Promise<boolean>;
