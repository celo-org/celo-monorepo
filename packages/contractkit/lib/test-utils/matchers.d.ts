import BigNumber from 'bignumber.js';
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeBigNumber(): R;
            toEqBigNumber(expected: BigNumber | string | number): R;
        }
    }
}
