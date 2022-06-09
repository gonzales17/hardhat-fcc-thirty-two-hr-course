const ethers = require("ethers");
const fs = require("fs-extra");
require("dotenv").config();
const prompt = require("prompt-sync")();

/**
 * Creates an encryptedKey.json file containing the encrypted generated from env variable PRIVATE_KEY
 * specified in file .env. PRIVATE_KEY should be something like 0x392023810ADB390FED...
 */
async function main() {
    const outfile = "./.encryptedKey.json";
    let passwd = "0";
    let passwd2 = "1";
    do {
        passwd = prompt("Enter password: ", { echo: "*" });
        passwd2 = prompt("Re-enter password: ", { echo: "*" });
    } while (passwd != passwd2);
    const wallet1 = new ethers.Wallet(
        prompt("Enter private key: ", { echo: "*" })
    );
    const encryptedJson = await wallet1.encrypt(
        passwd,
        process.env.PRIVATE_KEY
    );
    fs.writeFileSync(outfile, encryptedJson);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
