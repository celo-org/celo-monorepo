import BigNumber from 'bignumber.js';
export declare function zip<A, B, C>(fn: (a: A, b: B) => C, as: A[], bs: B[]): C[];
export declare function zip3<A, B, C>(as: A[], bs: B[], cs: C[]): [A, B, C][];
export declare function notEmpty<TValue>(value: TValue | null | undefined): value is TValue;
export declare function intersection<T>(arrays: T[][]): T[];
export interface AddressListItem {
    address: string;
    value: BigNumber;
}
export declare function linkedListChange(sortedList: AddressListItem[], change: AddressListItem): {
    lesser: string;
    greater: string;
    list: AddressListItem[];
};
export declare function linkedListChanges(sortedList: AddressListItem[], changeList: AddressListItem[]): {
    lessers: string[];
    greaters: string[];
    list: AddressListItem[];
};
