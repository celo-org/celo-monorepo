import * as base from '@celo/base/lib/collections';
import BigNumber from 'bignumber.js';
export { intersection, notEmpty, zip, zip3 } from '@celo/base/lib/collections';
export declare type AddressListItem = base.AddressListItem<BigNumber>;
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
