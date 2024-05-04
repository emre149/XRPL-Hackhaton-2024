import { Client, Wallet } from "xrpl";

const client = new Client("wss://s.devnet.rippletest.net:51233/");

const createAccountAndDID = async () => {
    await client.connect();

    // Create and fund a new account
    const { wallet } = await client.fundWallet();
    console.log('New Account Created:', wallet.address);

    // Generate a DID for the new account
    const did = `did:xrpl:${wallet.address}`;
    console.log('DID Generated:', did);

    await client.disconnect();
    return { wallet, did };
};

createAccountAndDID().then(({ wallet, did }) => {
    console.log(`Wallet Address: ${wallet.address}`);
    console.log(`DID: ${did}`);
}).catch(console.error);
