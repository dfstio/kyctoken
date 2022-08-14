#! /usr/bin/env ts-node
import { Command } from 'commander';
const program = new Command();
import { L3 } from './l3';
import { setPrice } from './price';
import { setLimit, trader } from './limit';
import { uniswap, pool } from './uniswap';

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
    .option('--trader', 'set high limit for trader')
    .action(async (address, options) => {
        const trader: boolean = options.trader ? true : false;
        console.log('Setting limit to ', trader ? 'trader' : '', address);
        await setLimit(address, trader);
    });

program
    .command('trader')
    .description('Set KYC limit to trader')
    .action(async () => {
        console.log('Setting limit to trader...');
        await trader();
    });

program
    .command('uniswap')
    .description('Create UNISWAP pool')
    .action(async () => {
        console.log('Creating Uniswap pool...');
        await uniswap();
    });

program
    .command('pool')
    .description('Set UNISWAP 1% pool limit')
    .action(async () => {
        console.log('Setting UNISWAP 1% pool limit...');
        await pool();
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
