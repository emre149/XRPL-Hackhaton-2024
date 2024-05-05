import { Client, Wallet, xrpToDrops } from "xrpl";
import chalk from 'chalk';
import pkg from 'elliptic';
const { ec } = pkg;

const client = new Client("wss://s.devnet.rippletest.net:51233/");
const ecInstance = new ec('secp256k1');

// ACCOUNT CREATION (XRPL + DID)
const main = async () => {
    console.log("Let's get started...");
    await client.connect();

    console.log("Let's fund 2 accounts...");
    const { wallet: wallet1, balance: balance1 } = await client.fundWallet();
    const { wallet: wallet2, balance: balance2 } = await client.fundWallet();

    console.log('wallet1', wallet1);
    console.log('wallet2', wallet2);

    console.log({
        balance1,
        address1: wallet1.address,
        balance2,
        address2: wallet2.address,
    });

    // Create and sign DID for wallet1
    const did1 = await createAndSignDID(wallet1);
    console.log(chalk.green("🌟 Summary of Operations Performed for wallet1:"));
    console.log(chalk.blue(`🔹 Unique User DID Generated: ${did1}`));

    // Create and sign DID for wallet2
    const did2 = await createAndSignDID(wallet2);
    console.log(chalk.green("🌟 Summary of Operations Performed for wallet2:"));
    console.log(chalk.blue(`🔹 Unique User DID Generated: ${did2}`));

    // Example invoice details
    const invoiceDetails = {
        issuer: did1,
        recipient: did2,
        amount: "1000",
        // Add other invoice details as needed
    };

    // Create and sign an invoice DID document for wallet1
    const signedInvoiceDID = await createInvoiceDIDDocument(wallet1, invoiceDetails);
    console.log(chalk.green("🌟 Signed Invoice DID Document:"));
    console.log(chalk.blue(JSON.stringify(signedInvoiceDID, null, 2)));

    await client.disconnect();
    console.log("All done!");
};

// VC SIGNATURE
async function createAndSignDID(wallet) {
    const publicKeyForAssertion = wallet.publicKey;
    const did = `did:xrpl:${wallet.address}`;
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

    // Sign the DID with the issuer's private key
    const signedVC = await signDID(did, wallet.privateKey);
    console.log(chalk.green("🌟 Signed DID Verifiable Credential:"));
    console.log(chalk.blue(JSON.stringify(signedVC, null, 2)));

    return did;
}

// SIGNATURE
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

// DIDDocument Creator
async function createInvoiceDIDDocument(wallet, invoiceDetails) {
    const did = `did:xrpl:${wallet.address}`;
    const didDocument = {
        "@context": "https://www.w3.org/ns/did/v1",
        "id": did,
        "controller": did,
        "verificationMethod": [{
            "id": `${did}#keys-1`,
            "type": "EcdsaSecp256k1RecoveryMethod2020",
            "controller": did,
            "publicKeyHex": wallet.publicKey
        }],
        "invoiceDetails": invoiceDetails // Add your invoice details here
    };

    // Sign the DID document
    const signedInvoiceDID = await signDID(did, wallet.privateKey);
    console.log(chalk.green("🌟 Signed Invoice DID Document:"));
    console.log(chalk.blue(JSON.stringify(signedInvoiceDID, null, 2)));

    return signedInvoiceDID;
}

function signData(data, privateKey) {
    const key = ecInstance.keyFromPrivate(privateKey, 'hex');
    const signature = key.sign(data);
    const derSign = signature.toDER('hex');
    return derSign;
}

main();
