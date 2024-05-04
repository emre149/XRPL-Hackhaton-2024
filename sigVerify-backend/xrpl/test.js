import xrpl from 'xrpl';
import axios from 'axios';
import chalk from 'chalk';
import pkg from 'elliptic';
const { ec: EC } = pkg;
import bs58 from 'bs58';

// Pinata API credentials and Axios instance for Pinata Cloud interactions
const pinataApiKey = 'Q5dtaEmOMD21dDBwfFxGq8WWlIT7UsmIzWB3QlFQsR53wyOA5tJV67qXfMEfGqjL';
const pinataSecretApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3ZDQ0ODlmNy01NzQ1LTQ5MzctYTVhNi1hNjI3MmQ4OWU0OGMiLCJlbWFpbCI6ImVkZWRlbW9nQHN0dWRlbnQuNDIuZnIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJpZCI6IkZSQTEiLCJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MX0seyJpZCI6Ik5ZQzEiLCJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MX1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiY2RjYjM4Mjc0NTcxMzczNzY5NmMiLCJzY29wZWRLZXlTZWNyZXQiOiIzZGJmOGYyMzE1NTFjOTdiYmYxMTNhOWUyYmE5MDFhY2Q3N2E4OWVjNTMxN2ZjYWRhNjVhNmJiZDJlZWI2YjliIiwiaWF0IjoxNzE0ODE0ODAxfQ.wSltN6Rc9zIX0ySHru01nHrZrkSDW2fjcoyDetf-kuE';
const pinataAxios = axios.create({
  baseURL: 'https://api.pinata.cloud/',
  headers: {
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretApiKey
  }
});
const prefixPinata = "https://gateway.pinata.cloud/ipfs/";


// Generates a wallet from a secret
async function generateWalletFromSecret(secret) {
    const wallet = xrpl.Wallet.fromSecret(secret);
    return wallet;
}

// Uploads JSON data to IPFS using Pinata
async function uploadJSONToIPFS(data) {
    try {
        const response = await pinataAxios.post('pinning/pinJSONToIPFS', data);
        return response.data.IpfsHash;
    } catch (error) {
        console.log(chalk.red('Error uploading JSON to IPFS:'), chalk.white.bgRed(error.message));
        return null;
    }
}

// Creates a user DID and uploads the DID document to IPFS
async function createDID(issuerWallet, publicKeyForAssertion) {
    const did = `did:xrpl:1:${issuerWallet.address}`;
    const didDocument = {
      "@context": "https://www.w3.org/ns/did/v1",
      "id": did,
      "controller": did,
      "verificationMethod": [{
        "id": `${did}#keys-1`,
        "type": "EcdsaSecp256k1RecoveryMethod2020",
        "controller": did,
        "publicKeyHex": publicKeyForAssertion
      }]
    };

    const didIPFSLink = await uploadJSONToIPFS(didDocument);
    const buffer = bs58.decode(didIPFSLink);
    const fullHexString = buffer.toString('hex');
    const hexCID = fullHexString.substring(4);

    // Outputting operation summary
    console.log(chalk.green("🌟 Summary of Operations Performed:"));
    console.log(chalk.blue(`🔹 Unique User DID Generated: ${did}`));
    console.log(chalk.yellow("📄 Detailed View of the DID Document:"));
    console.log(chalk.yellow(JSON.stringify(didDocument, null, 2)));
    console.log(chalk.blue(`🔗 Direct Link to DID Document on IPFS: ${prefixPinata + didIPFSLink}`));
    console.log(chalk.blue(`🔖 CID of the IPFS Content: ${hexCID}`));

    return prefixPinata + didIPFSLink;
}

// Main execution function
async function main() {
    // User credentials
    const userPublicKeyForAssertion = '0307248CE83C5301FAE84428730FA46A97F10F75784F633BBCD912C60973D7F2DA';
    const userSecret = "sEdToXXs9NXwguHsJjbWi4bGVwtKqsP";

    // Creating wallet and DID
    const issuerWallet = await generateWalletFromSecret(userSecret);
    await createDID(issuerWallet, userPublicKeyForAssertion);
}

// Running the main function
main();