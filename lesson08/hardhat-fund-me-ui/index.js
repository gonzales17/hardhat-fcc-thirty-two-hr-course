import { ethers } from "./ethers-5.6.esm.min.js";
import { FUND_ME_ABI, FUND_ME_CONTRACT_ADDRESS } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = balance;
withdrawButton.onclick = withdraw;

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        connectButton.innerHTML = "Connected!";
    } else {
        connectButton.innerHTML = "Please install MetaMask";
    }
}

async function fund() {
    const ethAmount = document.getElementById("ethAmount").value;
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            FUND_ME_CONTRACT_ADDRESS,
            FUND_ME_ABI,
            signer
        );
        try {
            const response = await contract.fund({
                value: ethers.utils.parseEther(ethAmount),
            });

            await listenForTransactionMine(response, provider);
        } catch (e) {
            console.log(e);
        }
    } else {
        console.log("Cannot fund because not connected to a wallet");
    }
}

function listenForTransactionMine(txnResponse, provider) {
    console.log(`Mining ${txnResponse.hash}...`);
    return new Promise((resolve, reject) => {
        provider.once(txnResponse.hash, (txnReceipt) => {
            console.log(
                `Completed with ${txnReceipt.confirmations} confirmations`
            );
            resolve();
        });
    });
}

async function balance() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            FUND_ME_CONTRACT_ADDRESS,
            FUND_ME_ABI,
            signer
        );
        const response = await provider.getBalance(contract.address);
        console.log(`Balance is ${ethers.utils.formatEther(response)}`);
    } else {
        console.log("Cannot fund because not connected to a wallet");
    }
}

async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            FUND_ME_CONTRACT_ADDRESS,
            FUND_ME_ABI,
            signer
        );
        try {
            const response = await contract.withdraw();
            await listenForTransactionMine(response, provider);
        } catch (e) {
            console.log(e);
        }
        console.log("Withdrawal completed.");
    } else {
        console.log("Cannot fund because not connected to a wallet");
    }
}
