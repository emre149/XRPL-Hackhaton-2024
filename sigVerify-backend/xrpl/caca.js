import { Client, Wallet } from "xrpl";
import chalk from 'chalk';

const client = new Client("wss://s.devnet.rippletest.net:51233/");

// Fetches a DID document from the XRP Ledger
async function getDIDDocument(did) {
    const client = new Client("wss://s.devnet.rippletest.net:51233/");
    let address = did.substring(11); // Extracts the XRPL address from the DID

    try {
        await client.connect();
        const response = await client.request({
            command: "account_objects",
            account: address,
            ledger_index: "validated"
        });

        if (response.result.account_objects.length === 0) {
            console.log(chalk.yellow("No DID objects found for the provided DID."));
            return null;
        }

        const didDocumentHex = response.result.account_objects[0].DIDDocument;

        console.log(chalk.green(`Successfully retrieved the DID document for: ${did}`));
        console.log(chalk.blackBright(` --> Value of DID Document: ${didDocumentHex}\n`));

        return didDocumentHex;
    } catch (error) {
        console.error(chalk.red(`Error fetching DID objects for address ${address}: ${error.message}`));
        return null;
    } finally {
        await client.disconnect();
    }
}

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

// Main function for fetching DID documents for given DIDs
async function main() {

	const { wallet: wallet1, balance: balance1 } = await client.fundWallet();
    const { wallet: wallet2, balance: balance2 } = await client.fundWallet();

    // Create and sign DID for wallet1
    const did1 = await createAndSignDID(wallet1);
    console.log(chalk.green("🌟 Summary of Operations Performed for wallet1:"));
    console.log(chalk.blue(`🔹 Unique User DID Generated: ${did1}`));

    // Create and sign DID for wallet2
    const did2 = await createAndSignDID(wallet2);
    console.log(chalk.green("🌟 Summary of Operations Performed for wallet2:"));
    console.log(chalk.blue(`🔹 Unique User DID Generated: ${did2}`));

    const issuerDID = "did:xrpl:1:rffGVvdyzRxT1KJLs6K4ZaNj5LiDJGxNvu";
    await getDIDDocument(issuerDID);

    const userDID = "did:xrpl:1:rp5vPZ49XvsqVtuWvaCSgwSbcya1HVpnaZ";
    await getDIDDocument(userDID);
}

// Run the main function and handle any exceptions
main().catch(error => console.error(chalk.redBright(`Critical error encountered: ${error}`)));
