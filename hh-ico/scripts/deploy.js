const {ethers} = require('hardhat');
const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS} = require("../constant");


async function main() {
    const cryptoDevsNFTContract = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;
    const cryptoDevsTokenContract = await ethers.getContractFactory("CryptoDevToken");

    const deployedCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(cryptoDevsNFTContract);

    console.log("Crypto Dev Tokens Contract address:", deployedCryptoDevsTokenContract.address);
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })