import { Event, State } from 'jest-circus';
import NodeEnvironment from 'jest-environment-node';
import { FlakeNotifier } from './FlakeNotifier';
export default class JestFlakeTrackingEnvironment extends NodeEnvironment {
    failures: Map<string, string[]>;
    notifier: FlakeNotifier;
    retryTimes: number;
    constructor(config: any);
    handleTestEvent(event: Event, state: State): Promise<void>;
}
