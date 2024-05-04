import { Wallet } from "xrpl";
import pkg from 'elliptic';
const { ec } = pkg;

const createInvoiceDIDDocument = async (issuerWallet, invoiceDetails) => {
    const did = `did:xrpl:${issuerWallet.address}`;
    const didDocument = {
        "@context": "https://www.w3.org/ns/did/v1",
        "id": did,
        "controller": did,
        "verificationMethod": [{
            "id": `${did}#keys-1`,
            "type": "EcdsaSecp256k1RecoveryMethod2020",
            "controller": did,
            "publicKeyHex": issuerWallet.publicKey
        }],
        "invoiceDetails": invoiceDetails
    };

    // Sign the DID document
    const signedInvoiceDID = await signDID(did, issuerWallet.privateKey, didDocument);
    console.log('Signed Invoice DID Document:', signedInvoiceDID);

    return signedInvoiceDID;
};

async function signDID(did, privateKey, document) {
    const vc = {
        "context": "https://www.w3.org/2018/credentials/v1",
        "type": ["VerifiableCredential"],
        "issuer": did,
        "issuanceDate": new Date().toISOString(),
        "credentialSubject": document
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

// Example usage
const issuerWallet = new Wallet('YOUR_SECRET_KEY_HERE'); // Replace with your actual secret key
const invoiceDetails = {
    issuer: "did:xrpl:issuer_address",
    recipient: "did:xrpl:recipient_address",
    amount: "1000",
    // Add other invoice details as needed
};

createInvoiceDIDDocument(issuerWallet, invoiceDetails).then(signedInvoiceDID => {
    console.log(signedInvoiceDID);
}).catch(console.error);
