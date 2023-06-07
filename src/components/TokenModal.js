import { Button, Modal, message, InputNumber, Spin } from "antd"
import { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplaceAbi from "@/constants/MP_NFTMarketplace.json"
import nftAuctionAbi from "@/constants/MP_NFTAuction.json"
import styles from "@/styles/components.module.css"
import { networkMapping } from "@/constants"

import { ethers } from "ethers"

export default function TokenModal({ data, collectionName, showModal, setShowModal, imageURI }) {
    const {
        id,
        nftAddress,
        tokenId,
        price,
        reservePrice,
        startTime,
        endTime,
        highestBid,
        seller,
        buyer,
        __typename,
    } = data

    const { chainId } = useMoralis()
    const [loading, setLoading] = useState(false)
    const [newBid, setNewBid] = useState("")

    const { runContractFunction } = useWeb3Contract()

    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const auctionAddress = chainId ? networkMapping[chainString].NFTAuction[0] : null

    ////////////////////
    //  HandleBuyNow  //
    ////////////////////

    async function handleBuyNow() {
        setLoading(true)

        const buyOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "buyItem",
            msgValue: price,
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
            },
        }

        const tx = await runContractFunction({
            params: buyOptions,
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => console.log(error),
        })

        console.log("tx: ", tx)

        const receipt = await tx.wait(1)

        console.log("receipt: ", receipt)

        setLoading(false)
        setShowModal(false)
        message.success(`Item Bought!`)
        // window.location.reload() // ---> user should probable be redirected to their profile page
        window.location.href = "/myProfile"
    }

    //////////////////////
    //  HandlePlaceBid  //
    //////////////////////

    async function handlePlaceBid() {
        setLoading(true)

        const bidOptions = {
            abi: nftAuctionAbi,
            contractAddress: auctionAddress,
            msgValue: newBid,
            functionName: "placeBid",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
            },
        }

        const tx = await runContractFunction({
            params: bidOptions,
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => console.log(error),
        })

        console.log("tx: ", tx)

        const receipt = await tx.wait(1)

        console.log("receipt: ", receipt)

        setLoading(false)
        setShowModal(false)
        message.success(`Bid Placed!`)
        window.location.reload()
    }

    useEffect(() => {
        console.log(newBid)
    }, [newBid])

    return (
        <Modal
            open={showModal}
            onCancel={() => setShowModal(false)}
            title={`Buy "${collectionName} #${tokenId}"`}
            footer={[
                <Button danger onClick={() => setShowModal(false)}>
                    Cancel
                </Button>,

                <Button
                    disabled={loading}
                    onClick={
                        __typename === "ActiveFixedPriceItem"
                            ? () => handleBuyNow()
                            : () => handlePlaceBid()
                    }
                    type="primary"
                    className={styles.button}
                >
                    {__typename === "ActiveFixedPriceItem" ? "Buy Now" : "Place Bid"}
                </Button>,
            ]}
        >
            <Spin spinning={loading}>
                <img
                    src={`${imageURI}`}
                    style={{
                        width: "250px",
                        margin: "auto",
                        borderRadius: "10px",
                        marginBottom: "15px",
                    }}
                />
                {__typename === "ActiveFixedPriceItem" ? (
                    <InputNumber
                        addonBefore={"Price"}
                        className={styles.centered}
                        style={{ width: "60%" }}
                        autoFocus
                        // formatter={value => ethers.utils.formatUnits(value, "ether")}
                        // parser={value => ethers.utils.parseUnits(value, "ether")}
                        placeholder={ethers.utils.formatUnits(price, "ether")}
                        disabled
                        // onChange captures each change as your typing and assigns to setPrice. You can't pass price direct to button without useState
                    />
                ) : (
                    <InputNumber
                        addonBefore={"Min Bid Required"}
                        className={styles.centered}
                        style={{ width: "60%" }}
                        autoFocus
                        // formatter={value => ethers.utils.formatUnits(value, "ether")}
                        // parser={(value) => ethers.utils.parseUnits(value, "ether")}
                        placeholder={ethers.utils.formatUnits(
                            reservePrice ? reservePrice : highestBid
                        )}
                        onChange={(value) => {
                            setNewBid(
                                ethers.utils.parseUnits(value.toString(), "ether").toString()
                            )
                        }}
                        // onChange captures each change as your typing and assigns to setPrice. You can't pass price direct to button without useState
                    />
                )}
            </Spin>
        </Modal>
    )
}
