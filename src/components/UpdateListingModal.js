import { Modal, Input, useNotification } from "web3uikit"
import { useState } from "react"
import { useWeb3Contract } from "react-moralis"
import nftMarketplaceAbi from "@/constants/Seal_NFTMarketplace.json"
import { ethers } from "ethers"

// the "onOk" function below is where we connect to the web3 contract via "useWeb3Contract"
export default function UpdateListingModal({
    nftAddress,
    tokenId,
    isVisible,
    marketplaceAddress,
    onClose,
}) {
    const dispatch = useNotification()

    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    const handleUpdateListingSuccess = async (tx) => {
        // use async/await to make sure "updateListing" xaction goes through first before we show user the notification
        await tx.wait(1)
        // notification
        dispatch({
            type: "success",
            message: "listing updated",
            title: "Listing updated - please refresh (and move blocks)",
            position: "topR",
        })
        onClose && onClose()
        setPriceToUpdateListingWith("0")
    }

    // define & run the updatelisting function call we need to interact with our marketplace contract
    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
        },
    })

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            // "onOk" is event handler we use to trigger "updateListing" function in our MP contract. "onOk" is included with the modal component by default
            onOk={() => {
                updateListing({
                    // console.log any error returned
                    onError: (error) => {
                        console.log(error)
                    },
                    // trigger "handleUpdateListingSuccess" if "updateListing" is successful which, in turn, shows user a notification
                    onSuccess: handleUpdateListingSuccess,
                })
            }}
        >
            <Input
                title={<div>"Edit Nickname"</div>}
                label="Update listing price in L1 Currency (ETH)"
                name="New listing price"
                type="number"
                onChange={(event) => {
                    setPriceToUpdateListingWith(event.target.value)
                }}
            />
        </Modal>
    )
}
