// This is the Sell Page with a from allowing user to list an item

import styles from "@/styles/Home.module.css"
import { Form, useNotification, Button } from "web3uikit"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import { networkMapping, nftMarketplaceAbi, nftAuctionAbi, nftAbi } from "@/constants" // when we reference a folder, we will pick up module.exports from our index.js
import { useEffect, useState } from "react"

export default function Home() {
    // "chainId" is known by Moralis bcos our header component passes our connected wallet info to the moralisProvider wrapper (initialised in _app.js)
    //          ---> the moralisProvider wrapper then passes this info down to all the components that it wraps
    //          ---> return value is in hex i.e. Goerli == "0x5"
    // "account" returns the account that is connected
    // "isWeb3Enabled" returns true or false keeping track of whether a wallet is available
    const { chainId, account, isWeb3Enabled } = useMoralis()
    // parseInt transforms hex format into number which we then change to String
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    // grab marketplace contract address from constants/networkMapping for the chain we're working on
    const marketplaceAddress = networkMapping[chainString].NFTMarketplace[0]
    // console.log(marketplaceAddress)

    const dispatch = useNotification()
    const [proceeds, setProceeds] = useState("0")

    // runContractFunction can send transactions & read state
    const { runContractFunction } = useWeb3Contract()

    async function approveAndList(data) {
        console.log("Approving...")
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult
        // the const "price" takes the input price in human readable form, converts it to Ethreum readable form & then changes it to string
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString()

        // define the "approve" function call we need to interact with our marketplace contract
        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId,
            },
        }

        await runContractFunction({
            // run the "approve" function call
            params: approveOptions,
            // trigger "handleBuyApproveSuccess" if "approve" is successful which, in turn, triggers the "listItem" function
            onSuccess: () => handleApproveSuccess(nftAddress, tokenId, price),
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => {
                console.log(error)
            },
        })
    }

    async function handleApproveSuccess(nftAddress, tokenId, price) {
        console.log("Ok! Now time to list")
        // define the "listItem" function call we need to interact with our marketplace contract
        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        }

        await runContractFunction({
            // run the "approve" function call
            params: listOptions,
            // trigger "handleListSuccess" if "listItem" is successful which, in turn, shows user a notification
            onSuccess: handleListSuccess,
            // console.log any error returned
            onError: (error) => console.log(error),
        })
    }

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    async function handleListSuccess(tx) {
        // use async/await to make sure "updateListing" xaction goes through first before we show user the notification i.e. that we get a block confirmation
        await tx.wait(1)
        // send notification
        dispatch({
            type: "success",
            message: "NFT listing",
            title: "NFT listed",
            position: "topR",
        })
    }

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    const handleWithdrawSuccess = async (tx) => {
        // use async/await to make sure "updateListing" xaction goes through first before we show user the notification i.e. that we get a block confirmation
        await tx.wait(1)
        // send notification
        dispatch({
            type: "success",
            message: "Withdrawing proceeds",
            position: "topR",
        })
    }

    async function setupUI() {
        const returnedProceeds = await runContractFunction({
            // define "getProceeds"; a Read function call we make to our marketplace contract
            params: {
                abi: nftMarketplaceAbi,
                contractAddress: marketplaceAddress,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            // console.log any error returned
            onError: (error) => console.log(error),
        })
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString())
        }
    }

    // if proceeds/account/isWeb3Enabled or chainId update; the page will re-render & if isWeb3Enabled=true it will run "setupUI()"
    useEffect(() => {
        if (isWeb3Enabled) {
            setupUI()
        }
    }, [proceeds, account, isWeb3Enabled, chainId])

    return (
        <div className={styles.container}>
            <Form
                // on submission of form trigger "approveAndList" function
                onSubmit={approveAndList}
                data={[
                    {
                        name: "NFT Address",
                        type: "text",
                        inputWidth: "50%",
                        value: "",
                        key: "nftAddress",
                    },
                    {
                        name: "Token ID",
                        type: "number",
                        value: "",
                        key: "tokenId",
                    },
                    {
                        name: "Price (in ETH)",
                        type: "number",
                        value: "",
                        key: "price",
                    },
                ]}
                title="Sell your NFT!"
                id="Main Form"
            />
            <div>Withdraw {proceeds} proceeds</div>
            {proceeds != "0" ? (
                <Button
                    onClick={() => {
                        runContractFunction({
                            // define "withdrawProceeds"; a Write function call we make to our marketplace contract
                            params: {
                                abi: nftMarketplaceAbi,
                                contractAddress: marketplaceAddress,
                                functionName: "withdrawProceeds",
                                params: {},
                            },
                            // console.log any error returned
                            onError: (error) => console.log(error),
                            // trigger "handleWithdrawSuccess" if "withdrawProceeds" is successful which, in turn, shows user a notification
                            onSuccess: handleWithdrawSuccess,
                        })
                    }}
                    text="Withdraw"
                    type="button"
                />
            ) : (
                <div>No proceeds detected</div>
            )}
        </div>
    )
}
