import Link from "next/link"
import { useState, useEffect } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { randomAvatar } from "@/constants/fluff"
import nftAbi from "../constants/BasicNft.json"
import Image from "next/image"
import { useNotification } from "web3uikit"
import { ethers } from "ethers"
import { truncateStr, formatUnits } from "../utils/truncate"
import {
    Avatar,
    Card,
    Tooltip,
    Modal,
    Form,
    Input,
    Select,
    Spin,
    Button,
    DatePicker,
    InputNumber,
} from "antd"

const { Meta } = Card

// props passed to NFTBox from index.js
export default function MktNFT_Box({
    __typename,
    nftAddress,
    tokenId,
    price,
    reservePrice,
    highestBid,
    marketplaceAddress,
    seller,
    saleType,
}) {
    const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [showModal, setShowModal] = useState(false)
    // hideModal sets showModal to false which hides our modal
    const hideModal = () => setShowModal(false)
    const dispatch = useNotification()

    async function updateUI() {
        const tokenURI = await getTokenURI()
        console.log(`The TokenURI is ${tokenURI}`)
        // We cheat a little here on decentralization by using an IPFS Gateway instead of IPFS directly because not all browsers are IPFS compatible
        // Rather than risk our FE showing blank images on some browsers, we update tokenURIs where "IPFS://" is detected to "HTTPS://"
        // The gateway "https://ipfs.io/ipfs/" is provided by the IPFS team
        // The other solution would be to store the image on a server (like Moralis) and call from there
        if (tokenURI) {
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json()
            const imageURI = tokenURIResponse.image
            const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            setImageURI(imageURIURL)
            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURIResponse.description)
        }
    }

    // define & run the getTokenURI function call we need to interact with the NFT's contract
    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    // run updateUI if isWeb3Enabled changes
    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    //     <Meta
    //     title={`${tokenName}     #${tokenId}`}
    //     description={tokenDescription}
    // />

    // seller we get from the owner of the token in the contract; account we get from user logged in to our FE
    // if "seller equals account" or if "seller equals undefined" then isOwnedByUser equals true
    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "You" : truncateStr(seller || "", 15)
    const amount = highestBid ?? reservePrice ?? price ?? ""

    return (
        <div>
            {imageURI ? (
                <Link
                    href="/collection/[collectionAddress]/[tokenId]"
                    as={`/collection/${nftAddress}/${tokenId}`}
                >
                    <a>
                        <Card
                            hoverable
                            style={{ width: 250, margin: 10 }}
                            cover={
                                <Image
                                    loader={() => imageURI}
                                    src={imageURI}
                                    height="250"
                                    width="250"
                                    // layout="fill"
                                    objectFit="contain"
                                    // style={{ height: "250px", width: "250px", objectFit: "cover" }}
                                />
                            }
                        >
                            <div
                                style={{
                                    fontSize: "25px",
                                    textAlign: "center",
                                    marginBottom: "10px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    width: "100%", // specify the width
                                }}
                            >
                                {" "}
                                {tokenName}
                            </div>
                            <Meta
                                avatar={<Avatar src={randomAvatar} />}
                                title={
                                    <div
                                        style={{
                                            fontSize: "20px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {formattedSellerAddress}
                                    </div>
                                }
                                description={
                                    <div style={{ whiteSpace: "pre-wrap" }}>
                                        <h1
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {saleType}
                                        </h1>
                                        <div
                                            style={{
                                                color: "black",
                                                fontSize: "20px",
                                                // fontWeight: "bold",
                                            }}
                                        >
                                            {formatUnits(price)}
                                        </div>
                                    </div>
                                }
                            />
                        </Card>
                    </a>
                </Link>
            ) : (
                <div>Loading...</div>
            )}
        </div>

        // <div>
        //     <UpdateListingModal
        //         isVisible={showModal} // nftBox needs to tell updateListingModal when the modal should be visible. Hence, the "isVisible" prop below will be true of false
        //         onClose={hideModal}
        //         tokenId={tokenId}
        //         marketplaceAddress={marketplaceAddress}
        //         nftAddress={nftAddress}
        //     />
    )
}
