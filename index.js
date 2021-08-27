const ethers = require("ethers")
const { FlashbotsBundleProvider } = require('@flashbots/ethers-provider-bundle')
const config = require('./config_secrets')

const provider = new ethers.getDefaultProvider("goerli");
const authSigner = new ethers.Wallet(config.authSigner_private_key)

const signer = new ethers.Wallet(config.wallet_private_key)
const transaction =  {
    to: "0x368c3FBB093C385C5d2Eb50726AB7a0e212B3a77",
    gasPrice: 100,
    gasLimit: 33000,
    chainId: 5,
    value: 0,
}


const sendTestBundle = async function(provider, authSigner, wallet, transaction) {

    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        authSigner,
        "https://relay-goerli.flashbots.net",
        "goerli"
    );

    txn_object = {
        signer: wallet,
        transaction: transaction
    }

    // creation bundle with multiple transaction to handle the gas spent in a bundle > 42000
    const signedTransactions = await flashbotsProvider.signBundle([
        txn_object,
        txn_object,
        txn_object,
        txn_object
    ]);
    
    const currentBlockNumber = await provider.getBlockNumber();

    const simulation = await flashbotsProvider.simulate(
        signedTransactions,
        currentBlockNumber + 1
    );

    if ("error" in simulation) {
        console.log(`Simulation Error: ${simulation.error.message}`);
    } else {
        console.log(
          `Simulation Success: ${currentBlockNumber} ${JSON.stringify(
            simulation,
            null,
            2
          )}`
        );
    }
    console.log(signedTransactions);

    // submitting multiple bundles to increase the probablity on inclusion
    for (let i = 1; i <= 10; i++) {
        const bundleRecipt = flashbotsProvider.sendRawBundle(
          signedTransactions,
          currentBlockNumber + i
        );
        console.log("submitted for block # ", currentBlockNumber + i);
    }
    console.log("bundles submitted");
}

sendTestBundle(provider, authSigner, signer, transaction)