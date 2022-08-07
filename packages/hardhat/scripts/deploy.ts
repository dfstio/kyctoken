import hre from "hardhat";

const { ethers } = hre;
const networkName = hre.network.name;
const chainId = hre.network.config.chainId;

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const lockedAmount = ethers.utils.parseEther("0.001");

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  await lock.deployed();

  console.log(`Lock with 0.001 ETH deployed to ${networkName} (chainId: ${chainId}) at address ${lock.address}`);
  console.log("Unlock time:", unlockTime);
  await sleep(30000);
  await hre.run("verify:verify", {
  		address: lock.address,
  		constructorArguments: [ unlockTime ]
	});
  
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
