import { TestResult } from '@jest/types/build/Circus';
export declare class FlakeNotifier {
    processFlakes(flakes: TestResult[]): Promise<[void, void][]>;
    processFlake(flake: TestResult): Promise<[void, void]>;
    createFlakeIssue(flake: TestResult): Promise<void>;
    leavePrComment(flake: TestResult): Promise<void>;
}
