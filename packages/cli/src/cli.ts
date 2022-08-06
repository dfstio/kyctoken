#! /usr/bin/env ts-node
import { Command } from 'commander';
const program = new Command();
import { L3 } from './l3';

program.name('kyc').description('CLI for KYC token').version('1.0.0');

program
  .command('L3')
  .description('Calling L3')
  .action(async () => {
    console.log('Calling L3... ');
    await L3();
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
