import axios from 'axios';
import { ethers } from 'ethers';
import fs from 'fs';
import { mumbaiGas, Gas } from './mumbai';
import { setLimit, trader } from './limit';

import { TRADER_ADDRESS, TRADER_KEY, RPC_MUMBAI } from '@kyctoken/config';
import { KERC20__factory } from '@kyctoken/hardhat';
import tokens from '@kyctoken/config/mumbai-tokens.json';
import prices from '@kyctoken/config/prices.json';
//const LJSON = require("@kyctoken/contracts/abi/contracts/ltoken.sol/LERC20.json");

// Uniswap
import { TickMath, encodeSqrtRatioX96, Position, Pool, nearestUsableTick, toHex, NonfungiblePositionManager } from '@uniswap/v3-sdk';
import { Percent, Token } from '@uniswap/sdk-core';
const UNISWAP_NFT = '0xc36442b4a4522e871399cd717abdd847ab11fe88';
const UNISWAP_QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

export async function uniswap() {
    const wallet: ethers.Wallet = new ethers.Wallet(TRADER_KEY);
    const provider: ethers.providers.Provider = new ethers.providers.JsonRpcProvider(RPC_MUMBAI);
    const signer: ethers.Wallet = wallet.connect(provider);
    const traderBalance: ethers.BigNumber = await provider.getBalance(TRADER_ADDRESS);
    console.log('Trader address:', TRADER_ADDRESS, 'with balance', ethers.utils.formatEther(traderBalance));
    await trader();
    await setLimit(UNISWAP_QUOTER_ADDRESS, true);

    let gas: Gas;

    for (let j = 0; j < tokens.length; j++) {
        const token = tokens[j];
        console.log('Approving ', token.token, '...');
        const kyc = KERC20__factory.connect(token.address, signer);
        gas = await mumbaiGas(1.2);
        const tx = await kyc.approve(UNISWAP_NFT, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', {
            gasLimit: 100000,
            maxFeePerGas: gas.maxFeePerGas,
            maxPriorityFeePerGas: gas.maxPriorityFeePerGas
        });
        await tx.wait(2);
    }

    for (let k = 0; k < tokens.length - 1; k++) {
        for (let i = k + 1; i < tokens.length; i++) {
            try {
                console.log('Minting', tokens[k].token, tokens[i].token);
                const amounti = 100 * prices[i]; //parseInt(10000 * prices[i]);
                const amountk = 100 * prices[k];
                const price = prices[i];

                const reverse = BigInt(tokens[i].address) > BigInt(tokens[k].address) ? true : false;
                console.log('reverse', reverse);
                let sqrtPrice = encodeSqrtRatioX96(amounti, amountk);
                if (reverse) sqrtPrice = encodeSqrtRatioX96(amountk, amounti);
                const sqrtPriceEncoded = `0x${sqrtPrice.toString(16)}`;
                const TICK_SPACING = 20;
                const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtPrice);
                const tickLower = nearestUsableTick(tickCurrent, TICK_SPACING) - TICK_SPACING * 2; //TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(  amount, parseInt(price * 1.02 * amount)));
                const tickUpper = nearestUsableTick(tickCurrent, TICK_SPACING) + TICK_SPACING * 2; //TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(  amount, parseInt(price * 0.98 * amount) ));
                console.log('tick: ', tickCurrent, tickLower, tickUpper);

                const LEUR = new Token(80001, tokens[i].address, 18, tokens[i].token, 'KYC token ' + tokens[i].currency);
                const LUSD = new Token(80001, tokens[k].address, 18, tokens[k].token, 'KYC token ' + tokens[k].currency);
                const myPool = new Pool(LUSD, LEUR, 500, sqrtPrice, 0, tickCurrent, []);

                let poolAddress = Pool.getAddress(LUSD, LEUR, 500);
                let code = await provider.getCode(poolAddress);
                console.log('Pool address:', poolAddress, 'size:', code.length);
                if (code.length < 5) {
                    const { calldata, value } = NonfungiblePositionManager.createCallParameters(myPool);
                    /*
							  public static createCallParameters(pool: Pool)
					*/
                    gas = await mumbaiGas(1.2);
                    let txPool = {
                        from: TRADER_ADDRESS,
                        to: UNISWAP_NFT,
                        data: calldata,
                        value,
                        chainId: 80001,
                        gasLimit: 7000000,
                        maxFeePerGas: gas.maxFeePerGas,
                        maxPriorityFeePerGas: gas.maxPriorityFeePerGas
                    };

                    const tx = await signer.sendTransaction(txPool);
                    console.log('tx hash', tx.hash);
                    const receipt = await tx.wait(2);
                    console.log('Transaction block:', receipt.blockNumber);
                    poolAddress = Pool.getAddress(LUSD, LEUR, 500);
                    code = await provider.getCode(poolAddress);
                    console.log('New Pool address:', poolAddress, 'size:', code.length);
                    if (code.length < 5) {
                        console.error('Pool mint failure');
                        return;
                    }
                }
                await setLimit(poolAddress, true);

                const position: Position = Position.fromAmounts({
                    pool: myPool,
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    amount0: reverse ? 1e23 / prices[k] : 1e23 / prices[i],
                    amount1: reverse ? 1e23 / prices[i] : 1e23 / prices[k],
                    useFullPrecision: false
                });

                const startTime = Date.now();
                const deadline = startTime + 1000 * 60 * 30;
                const slippageTolerance = new Percent(5, 1000);
                const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
                    slippageTolerance: slippageTolerance,
                    recipient: TRADER_ADDRESS,
                    deadline: deadline.toString(),
                    createPool: false
                });
                /*
						  public static createCallParameters(pool: Pool)
						  const pool = "0x"+ receipt.events[0].data.slice(90, 130);
						  console.log('Created pool:', pool); 
  					*/
                gas = await mumbaiGas(1.2);
                let txn = {
                    from: TRADER_ADDRESS,
                    to: UNISWAP_NFT,
                    data: calldata,
                    value,
                    chainId: 80001,
                    gasLimit: 7000000,
                    maxFeePerGas: gas.maxFeePerGas,
                    maxPriorityFeePerGas: gas.maxPriorityFeePerGas
                };
                //console.log("txn", txn);

                const tx = await signer.sendTransaction(txn);
                console.log('tx hash', tx.hash);
                const receipt = await tx.wait(2);
                console.log('Transaction block:', receipt.blockNumber);
            } catch (error) {
                console.error('catch', (<any>error).toString().substr(0, 500));
            }
        }
    }

    const traderBalance2: ethers.BigNumber = await provider.getBalance(TRADER_ADDRESS);
    console.log(
        'Trader balance:',
        ethers.utils.formatEther(traderBalance2),
        'was spent:',
        ethers.utils.formatEther(traderBalance.sub(traderBalance2))
    );
}
