import {BaseCommand} from '../../base'
import chalk from "chalk";

export default class Id extends BaseCommand {
    static description = 'View network parameters';

    static flags = {
        ...BaseCommand.flags,
    };

    async run() {
        const networkId: string = (await this.kit.web3.eth.net.getId()).toString();

        console.log(chalk`Network Id: {bold ${networkId}}.`)
    }
}
