import { Client, Wallet } from "xrpl";
import chalk from 'chalk';
import pkg from 'elliptic';
const { ec } = pkg;

const client = new Client("wss://s.altnet.rippletest.net:51233");
const ecInstance = new ec('secp256k1');

const main = async () => {
 console.log("Let's get started...");
 await client.connect();

 console.log('Let\'s fund 1 account...');
 const { wallet: wallet1, balance: balance1 } = await client.fundWallet();
  
 console.log('wallet1', wallet1);
  
 console.log({ 
    balance1, 
    address1: wallet1.address,
 });

 // Use the public key from the wallet object for assertion
 const publicKeyForAssertion = wallet1.publicKey;
 const did = await createDID(wallet1, publicKeyForAssertion);

 console.log(chalk.green("🌟 Summary of Operations Performed:"));
 console.log(chalk.blue(`🔹 Unique User DID Generated: ${did}`));

 // Sign the DID with the issuer's private key
 const signedVC = await signDID(did, wallet1.privateKey);
 console.log(chalk.green("🌟 Signed DID Verifiable Credential:"));
 console.log(chalk.blue(JSON.stringify(signedVC, null, 2)));

 await client.disconnect();
 console.log("All done!");
};

async function createDID(issuerWallet, publicKeyForAssertion) {
 const did = `did:sigverify:1:${issuerWallet.address}`;
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

 console.log(chalk.yellow("📄 Detailed View of the DID Document:"));
 console.log(chalk.yellow(JSON.stringify(didDocument, null, 2)));

 return did;
}

async function signDID(did, privateKey) {
    const vc = {
        "context": "https://www.w3.org/2018/credentials/v1",
        "type": ["VerifiableCredential"],
        "issuer": did,
        "issuanceDate": new Date().toISOString(),
        "credentialSubject": {
            "id": did,
            "type": "DIDIdentity"
        }
    };

    try {
        const vcString = JSON.stringify(vc);
        const signature = signData(vcString, privateKey);
        vc['proof'] = {
            "type": "EcdsaSecp256k1RecoveryMethod2020",
            "created": new Date().toISOString(),
            "proofPurpose": "assertionMethod",
            "verificationMethod": did + '#keys-1',
            "signature": signature
        };
        return vc;
    } catch (error) {
        console.error("Error during DID VC creation and signing:", error);
        return null;
    }
}

function signData(data, privateKey) {
    const key = ecInstance.keyFromPrivate(privateKey, 'hex');
    const signature = key.sign(data);
    const derSign = signature.toDER('hex');
    return derSign;
}

main();
