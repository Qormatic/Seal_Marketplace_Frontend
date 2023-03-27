import Link from "next/link"
import { useState, useEffect } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplaceAbi from "../constants/MP_NFTMarketplace.json"
import nftAbi from "../constants/BasicNft.json"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModal from "./UpdateListingModal"
import { truncateStr } from "../utils/truncate"

// props passed to NFTBox from index.js
export default function NFTBox({
    price,
    nftAddress,
    tokenId,
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

    // define & run the getTokenURI function call we need to interact with the NFT's contract
    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

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

    // run updateUI if isWeb3Enabled changes
    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    // seller we get from the owner of the token in the contract; account we get from user logged in to our FE
    // if "seller equals account" or if "seller equals undefined" then isOwnedByUser equals true
    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15)
    const formattedPrice = price === null ? 0 : price

    // <image /> tag below uses a uri to return an image
    return (
        <div>
            <div>
                {imageURI ? (
                    <div>
                        <UpdateListingModal
                            isVisible={showModal} // nftBox needs to tell updateListingModal when the modal should be visible. Hence, the "isVisible" prop below will be true of false
                            onClose={hideModal}
                            tokenId={tokenId}
                            marketplaceAddress={marketplaceAddress}
                            nftAddress={nftAddress}
                        />
                        <Link
                            href="/[collectionAddress]/[tokenId]"
                            as={`/${nftAddress}/${tokenId}`}
                        >
                            <a>
                                <Card
                                    title={tokenName}
                                    description={tokenDescription}
                                    // onClick={handleCardClick} // "onClick" is event handler which we use to trigger buyItem function in our MP contract when the NFT card is clicked
                                >
                                    <div className="p-2">
                                        <div className="flex flex-col items-end gap-2">
                                            <div>#{tokenId}</div>
                                            <div className="italic text-sm">
                                                Owned by {formattedSellerAddress}
                                            </div>
                                            <Image
                                                loader={() => imageURI}
                                                src={imageURI}
                                                height="200"
                                                width="200"
                                            />
                                            <div className="font-bold">{saleType}</div>
                                            <div className="font-bold">
                                                {ethers.utils.formatUnits(formattedPrice, "ether")}{" "}
                                                ETH
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </a>
                        </Link>
                    </div>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        </div>
    )
}
