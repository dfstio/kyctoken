#! /usr/bin/env ts-node
import { Command } from 'commander';
const program = new Command();
import { L3 } from './l3';
import { setPrice } from './price';
import { setLimit } from './limit';

program.name('kyc').description('CLI for KYC token').version('1.0.0');

program
    .command('L3')
    .description('Calling L3')
    .action(async () => {
        console.log('Calling L3... ');
        await L3();
    });

program
    .command('price')
    .description('Set KYC token price')
    .argument('<price>', 'price')
    .action(async (price) => {
        console.log('Setting price to ', price);
        await setPrice(parseInt(price.toString()));
    });

program
    .command('limit')
    .description('Set KYC limit to address')
    .argument('<address>', 'address')
    .action(async (address) => {
        console.log('Setting limit to ', address);
        await setLimit(address);
    });

async function main() {
    await program.parseAsync();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
