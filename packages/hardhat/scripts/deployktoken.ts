import hre from 'hardhat';
import fs from 'fs';
import { CLIENT1_ADDRESS, CLIENT2_ADDRESS, TRADER_ADDRESS } from '@kyctoken/config';

const { ethers } = hre;
const networkName = hre.network.name;
const chainId = hre.network.config.chainId;

interface Token {
    name: string;
    price: number;
    amount: number;
}

const tokens: Token[] = [
    { name: 'ETH', price: 1716, amount: 1000 },
    { name: 'BTC', price: 23286, amount: 100 }
];

async function main() {
    const Contract = await ethers.getContractFactory('KERC20');
    console.log(`Deploying KERC20 to ${networkName} (chainId: ${chainId})`);
    const accounts = await hre.ethers.getSigners();
    const owner = accounts[0].address;
    const ownerBalance = await hre.ethers.provider.getBalance(owner);
    console.log('Deployer address:', owner, 'with balance', (Number(ownerBalance) / 1e18).toFixed(4));

    let i;
    let contracts = [];
    for (
        i = 0;
        i < tokens.length;
        i++ //tokens.length
    ) {
        const SYM = tokens[i].name;
        const ltoken = await Contract.deploy('KYC token ' + SYM, 'K' + SYM, BigInt(1e9) * BigInt(1e18), tokens[i].price);
        await ltoken.deployed();
        console.log('K' + SYM + ' deployed to:', ltoken.address);
        contracts.push({ id: i, token: 'K' + SYM, address: ltoken.address, currency: SYM, name: 'KYC token ' + SYM, owner: owner });

        const balance = await ltoken.balanceOf(owner);
        console.log('Owner balance:', SYM, (Number(balance) / 1e18).toLocaleString('en'));

        let tx = await ltoken.mint(CLIENT1_ADDRESS, BigInt(tokens[i].amount * 2) * BigInt(1e18));
        await tx.wait(2);
        const balanceClient1 = await ltoken.balanceOf(CLIENT1_ADDRESS);
        console.log('Client1 balance:', SYM, (Number(balanceClient1) / 1e18).toLocaleString('en'));

        tx = await ltoken.mint(CLIENT2_ADDRESS, BigInt(tokens[i].amount) * BigInt(1e18));
        await tx.wait(2);
        const balanceClient2 = await ltoken.balanceOf(CLIENT2_ADDRESS);
        console.log('Client2 balance:', SYM, (Number(balanceClient2) / 1e18).toLocaleString('en'));

        tx = await ltoken.mint(TRADER_ADDRESS, BigInt(tokens[i].amount * 100) * BigInt(1e18));
        await tx.wait(2);
        const balanceTrader = await ltoken.balanceOf(TRADER_ADDRESS);
        console.log('Trader balance:', SYM, (Number(balanceTrader) / 1e18).toLocaleString('en'));

        if (networkName == 'mumbai') {
            try {
                await hre.run('verify:verify', {
                    address: ltoken.address,
                    constructorArguments: ['KYC token ' + SYM, 'K' + SYM, BigInt(1e9) * BigInt(1e18), tokens[i].price]
                });
            } catch (error) {
                console.error('catch', (<any>error).toString().substr(0, 500));
            }
        }
    }
    const filename = 'tokens.json';

    const writeData = JSON.stringify(contracts, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
        .replaceAll('},', '},\n')
        .replaceAll('[', '[\n')
        .replaceAll(']', '\n]');
    await fs.writeFile(filename, writeData, function (err) {
        if (err) return console.log(err);
    });

    const ownerBalance2 = await hre.ethers.provider.getBalance(owner);
    console.log('Deployer balance:', (Number(ownerBalance2) / 1e18).toFixed(4), 'was spent:', Number((Number(ownerBalance) - Number(ownerBalance2)) / 1e18).toFixed(4));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
