export declare function zip<A, B, C>(fn: (a: A, b: B) => C, as: A[], bs: B[]): C[];
export declare function zip3<A, B, C>(as: A[], bs: B[], cs: C[]): [A, B, C][];
export declare function notEmpty<TValue>(value: TValue | null | undefined): value is TValue;
export declare function intersection<T>(arrays: T[][]): T[];
export declare type Comparator<T> = (a: T, b: T) => boolean;
export interface AddressListItem<T> {
    address: string;
    value: T;
}
export declare function linkedListChange<T>(sortedList: Array<AddressListItem<T>>, change: AddressListItem<T>, comparator: Comparator<T>): {
    lesser: string;
    greater: string;
    list: Array<AddressListItem<T>>;
};
export declare function linkedListChanges<T>(sortedList: Array<AddressListItem<T>>, changeList: Array<AddressListItem<T>>, comparator: Comparator<T>): {
    lessers: string[];
    greaters: string[];
    list: Array<AddressListItem<T>>;
};
