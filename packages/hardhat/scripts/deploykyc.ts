import hre from 'hardhat';

const { ethers } = hre;
const networkName = hre.network.name;
const chainId = hre.network.config.chainId;

const price = 1700;

async function main() {
    const KYC = await ethers.getContractFactory('KYC');
    const kyc = await KYC.deploy(price);

    await kyc.deployed();

    console.log(`KYC deployed to ${networkName} (chainId: ${chainId}) at address ${kyc.address}`);

    if (networkName == 'mumbai') {
        await sleep(30000);
        await hre.run('verify:verify', {
            address: kyc.address,
            constructorArguments: [price]
        });
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
