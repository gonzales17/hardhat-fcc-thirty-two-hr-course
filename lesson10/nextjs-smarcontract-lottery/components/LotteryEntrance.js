import { useEffect, useState } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { abi, contractAddresses } from "../constants";
import { ethers } from "ethers";
import { useNotification } from "web3uikit";

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis();
    const chainId = parseInt(chainIdHex);
    const lotteryAddress =
        chainId in contractAddresses ? contractAddresses[chainId][0] : null;
    const [entranceFee, setEntranceFee] = useState("0"); // initial value of "0" for entrance fee
    const [numberOfPlayers, setNumberOfPlayers] = useState("0");
    const [winner, setWinner] = useState("0");

    const dispatch = useNotification();

    const {
        runContractFunction: enterLottery,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "enterLottery",
        params: {},
        msgValue: entranceFee,
    });

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getEntranceFee",
        params: {},
    });

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    });

    const { runContractFunction: getWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getWinner",
        params: {},
    });

    async function updateUI() {
        let result = await getEntranceFee();
        setEntranceFee(result.toString());
        console.log("getEntranceFee returned", result);
        result = await getNumberOfPlayers();
        setNumberOfPlayers(result.toString());
        result = await getWinner();
        setWinner(result.toString());
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI();
        }
    }, [isWeb3Enabled]);

    const handleSuccess = async function (tx) {
        await tx.wait(1);
        handleNewNotificaion();
        updateUI();
    };

    const handleNewNotificaion = function (tx) {
        dispatch({
            type: "info",
            message: "Transaction complete",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        });
    };

    return (
        <div className="p-5">
            {lotteryAddress ? (
                <div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async function () {
                            await enterLottery({
                                onSuccess: handleSuccess,
                                onError: (error) => {
                                    console.log(error);
                                },
                            });
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Lottery</div>
                        )}
                    </button>
                    <div>
                        Entrance fee:{" "}
                        {ethers.utils.formatUnits(entranceFee, "ether")} ETH
                    </div>
                    <div>Number of players: {numberOfPlayers}</div>
                    <div>Winner: {winner}</div>
                </div>
            ) : (
                <div>No Lottery address exists</div>
            )}
        </div>
    );
}
