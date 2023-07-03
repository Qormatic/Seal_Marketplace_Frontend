// This is the template for "NFT Collection Page"

import {
    GET_ACTIVE_ITEMS,
    GET_ACTIVE_COLLECTIONS,
    GET_USER_COLLECTION,
    GET_ACTIVE_COLLECTION_ITEMS,
} from "@/constants/subgraphQueries"
// import Image from "next/image"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
import { NFT_OnSaleFilter, NFT_CollectionFilter } from "@/components/Filter"
import NFTList from "@/components/NFTList"
import NFTList_OffSale from "@/components/NFTList_OffSale"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { avatars, collectionDescriptions } from "@/constants/fluff"
import contractAbi from "@/constants/Seal_721_Contract.json"
import { Fragment } from "react"
import nftAbi from "@/constants/BasicNft.json"
import { truncateStr } from "@/utils/truncate"
import { getDecryptedImage } from "@/utils/decryptImage"
import { checkSealContract } from "@/utils/sealContract"
import Link from "next/link"
import { NftFilters, Alchemy, Network } from "alchemy-sdk"
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import {
    Layout,
    Row,
    Col,
    Typography,
    Image,
    Tooltip,
    Card,
    Modal,
    InputNumber,
    Spin,
    Space,
    message,
    Button,
    Avatar,
    Divider,
    Form,
} from "antd"

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

export default function CollectionPage({ NFTListData, collectionData, profileData }) {
    const [showOnSale, setShowOnSale] = useState(true)
    const [showAll, setShowAll] = useState(true)
    const [showAuction, setShowAuction] = useState(false)
    const [showFixedPrice, setShowFixedPrice] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [src, setSrc] = useState("/images/placeholder.png")

    const { isWeb3Enabled, chainId, account } = useMoralis()

    //////////////////////////////
    //  Get On & Off-Sale NFTs  //
    //////////////////////////////

    // let allNfts = []
    let offSaleNfts = []
    let allOnSaleNfts = []

    // allNfts = [
    //     ...NFTListData.activeFixedPriceItems,
    //     ...NFTListData.activeAuctionItems,
    //     ...NFTListData.inActiveItems,
    // ]
    offSaleNfts = [...NFTListData.inActiveItems]
    allOnSaleNfts = [...NFTListData.activeFixedPriceItems, ...NFTListData.activeAuctionItems]

    //////////////////
    //  Mint Modal  //
    //////////////////

    const [showMintModal, setShowMintModal] = useState(false)

    const handleOpenMintModal = () => {
        // We open Mint Modal
        setShowMintModal(true)
    }

    const handleCloseMintModal = () => {
        // We close Mint Modal
        setShowMintModal(false)
    }

    ////////////////////////////////////
    //  For Sale/Not For Sale Filter  //
    ////////////////////////////////////

    // toggle show user NFT items or marcopolo collections
    const handleShowOnSale = () => {
        if (showOnSale) {
            setShowOnSale(false) // if showOnSale is true, set it to false
        } else {
            setShowOnSale(true) // if showOnSale is false, set it to true
        }
    }

    ///////////////////////////////
    //  For Sale Filter Buttons  //
    ///////////////////////////////

    const handleShowAllItems = () => {
        setShowAll(true)
        setShowAuction(false)
        setShowFixedPrice(false)
    }

    const handleFixedPriceFilter = () => {
        setShowFixedPrice(true)
        setShowAll(false)
        setShowAuction(false)
    }

    const handleAuctionFilter = () => {
        setShowAuction(true)
        setShowAll(false)
        setShowFixedPrice(false)
    }

    //////////////////////
    //  Get Page Image  //
    //////////////////////

    async function updateUI() {
        const isOwner = account === collectionData.contractDeployer.toLowerCase()

        if (isOwner) {
            setIsOwner(true)
        } else {
            setIsOwner(false)
        }

        if (
            collectionData.sealContract === true &&
            collectionData.private === true &&
            isOwner === true
        ) {
            fetch("/api/decrypt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageUri: profileData.imageUri }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }
                    return response.json()
                })
                .then((data) => {
                    if (data.error) {
                        console.error("Error:", data.error)
                    } else {
                        console.log("Decrypted image URI:", data.decryptedImageUri)
                        setSrc(data.decryptedImageUri)
                    }
                })
                .catch((error) => {
                    console.error("Error:", error)
                })
            // const decryptedImage = await getDecryptedImage(profileData.imageUri)
            // setSrc(decryptedImage)
        } else {
            setSrc(profileData.imageUri)
        }
    }

    //////////////////////////
    //  Handle Image Error  //
    //////////////////////////

    const handleError = (error) => {
        console.log("Error: ", error)

        setSrc("/images/placeholder.png")
    }

    /////////////////////
    //  NFT List Data  //
    /////////////////////

    // filtering of On Sale NFTs
    const filteredOnSaleNfts = showFixedPrice
        ? NFTListData.activeFixedPriceItems
        : showAuction
        ? NFTListData.activeAuctionItems
        : allOnSaleNfts

    // run updateUI if isWeb3Enabled changes
    useEffect(() => {
        updateUI()
    }, [account])

    return (
        <div>
            <Layout style={{ background: "#fff" }}>
                <Content style={{ background: "#f7f7f7" }}>
                    <div align="center" style={{ padding: "10px" }}>
                        <Space>
                            <Image src={src} onError={handleError} width={300} height={300} />
                        </Space>
                    </div>
                </Content>
                <div style={{ padding: "50px" }}>
                    <Content>
                        <div>
                            <Title style={{ paddingTop: "20px" }} level={1}>
                                {collectionData.name}
                            </Title>
                            {/* can use gutter in row instead of span in col */}
                            <CollectionInfoCard
                                isOwner={isOwner}
                                collectionData={collectionData}
                                handleOpenMintModal={handleOpenMintModal}
                            />
                            <Row gutter={[30, 30]}>
                                <Col span={12}>
                                    <Title
                                        style={{ marginBottom: "0px", paddingTop: "40px" }}
                                        level={2}
                                    >
                                        Description
                                    </Title>

                                    <Divider
                                        style={{
                                            marginBottom: "15px",
                                            marginTop: "10px",
                                            padding: "0px",
                                        }}
                                    />
                                    <Text style={{ color: "black", fontSize: "50" }}>
                                        {profileData.description}
                                    </Text>
                                </Col>
                            </Row>
                        </div>
                    </Content>
                    <div>
                        <Row style={{ paddingTop: "40px" }}>
                            <Title level={2}>From this Collection</Title>
                            <Divider style={{ width: "100%", marginTop: "10px" }} />
                        </Row>
                        <NFT_CollectionFilter
                            handleShowOnSale={handleShowOnSale}
                            showOnSale={showOnSale}
                        />
                        <Divider style={{ width: "100%" }} />

                        {isWeb3Enabled && chainId ? (
                            showOnSale ? (
                                allOnSaleNfts.length > 0 ? (
                                    <Fragment>
                                        <div>
                                            {" "}
                                            <NFT_OnSaleFilter
                                                fixedNftsLength={
                                                    NFTListData.activeFixedPriceItems.length
                                                }
                                                auctionNftsLength={
                                                    NFTListData.activeAuctionItems.length
                                                }
                                                allNftsLength={allOnSaleNfts.length}
                                                handleFixedPriceFilter={handleFixedPriceFilter}
                                                handleAuctionFilter={handleAuctionFilter}
                                                handleShowAllItems={handleShowAllItems}
                                                showFixedPrice={showFixedPrice}
                                                showAuction={showAuction}
                                                showAllActive={showAll}
                                            />
                                        </div>
                                        <div>
                                            <NFTList
                                                NFTListData={filteredOnSaleNfts}
                                                showOnSale={showOnSale}
                                            />{" "}
                                        </div>
                                    </Fragment>
                                ) : (
                                    <div>
                                        It looks like this collection currently has no NFTs for
                                        sale!
                                    </div>
                                )
                            ) : offSaleNfts.length > 0 ? (
                                <Fragment>
                                    <div>
                                        <NFTList_OffSale NFTListData={offSaleNfts} />{" "}
                                    </div>
                                </Fragment>
                            ) : (
                                <div>It looks like there's nothing to see here!</div>
                            )
                        ) : (
                            <div>Web3 Currently Not Enabled</div>
                        )}
                    </div>
                </div>
                <Footer />
            </Layout>
            <MintModal
                supply={collectionData.remainingSupply}
                showMintModal={showMintModal}
                handleCloseMintModal={handleCloseMintModal}
                contractAddress={collectionData.address}
                creatorAddress={collectionData.contractDeployer}
            />
        </div>
    )
}

export async function getServerSideProps({ params }) {
    const { collectionAddress } = params || {}

    /////////////////////
    //  Apollo Client  //
    /////////////////////

    // "context" contains the parameters used to create the current route user is on
    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    //////////////////////
    //  Alchemy Client  //
    //////////////////////

    const alchemy = new Alchemy({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        network: Network.MATIC_MUMBAI,
    })

    ///////////////////////////////////////////////////
    // Check if Seal contract & has remaining tokens //
    ///////////////////////////////////////////////////

    const sealCheck = await checkSealContract(collectionAddress)
    console.log("sealCheck: ", collectionAddress, sealCheck)

    let collectionData = {}
    let collection

    ///////////////////////////////////
    //  Get Seal Collection Details  //
    ///////////////////////////////////

    // if sealCheck.contractDeployer !== false it's a sealContract
    if (sealCheck.contractDeployer !== false) {
        try {
            const {
                data: { contractCreated },
            } = await client.query({
                query: GET_USER_COLLECTION,
                variables: {
                    id: collectionAddress,
                },
            })
            collection = contractCreated

            console.log(collection)
        } catch (error) {
            console.error(collection)
        }

        collectionData = {
            address: collection.contractAddress,
            name: collection.name,
            symbol: collection.symbol,
            tokenType: collection.tokenType,
            remainingSupply: sealCheck.remainingSupply,
            sealContract: true,
            royaltiesReceiver: collection.royaltiesReceiver,
            royaltiesPercentage: collection.royaltiesPercentage,
            private: collection.privateView,
            createdTimestamp: collection.block.timestamp,
            contractDeployer:
                collection.contractDeployer ??
                (sealCheck.contractDeployer !== false ? sealCheck.contractDeployer : "Unknown"),
        }
    } else {
        ///////////////////////////////////////
        //  Get External Collection Details  //
        ///////////////////////////////////////

        try {
            collection = await alchemy.nft.getContractMetadata(collectionAddress, {
                // excludeFilters: [NftFilters.SPAM],
            })

            console.log(collection)
        } catch (error) {
            console.error(error)
        }

        collectionData = {
            address: collection.address,
            name: collection.name,
            symbol: collection.symbol,
            tokenType: collection.tokenType,
            remainingSupply: 0,
            sealContract: false,
            contractDeployer:
                collection.contractDeployer ??
                (sealCheck.contractDeployer !== false ? sealCheck.contractDeployer : "Unknown"),
        }
    }

    /////////////////////////
    //  Get On-Sale Items  //
    /////////////////////////

    const currentTime = Math.floor(Date.now() / 1000)

    let data = { activeFixedPriceItems: [], activeAuctionItems: [] }

    try {
        const response = await client.query({
            query: GET_ACTIVE_COLLECTION_ITEMS,
            variables: {
                collectionAddress: collectionAddress,
                currentTime: currentTime,
            },
        })

        console.log(response.data)

        data = response.data
    } catch (error) {
        console.error(error)
    }

    // create new var bcos "data" is not editable
    let newData = { ...data }

    console.log("newData: ", newData)

    const activeItems = [...newData.activeFixedPriceItems, ...newData.activeAuctionItems]

    console.log("activeItems: ", activeItems)

    ///////////////////////
    //  Redirect to 500  //
    ///////////////////////

    // if the collection is not Seal and it has no On-Sale items; redirect user to 500 page
    if (collectionData.sealContract === false && activeItems.length === 0) {
        return {
            redirect: {
                destination: "/500",
                permanent: false,
            },
        }
    }

    ////////////////////////////////////
    //  Get all NFTs for Seal contract  //
    ////////////////////////////////////

    if (collectionData.sealContract === true) {
        const { ownedNfts } = await alchemy.nft.getNftsForOwner(collectionData.contractDeployer, {
            contractAddresses: [collectionAddress],
            omitMetadata: false,
        })

        const allNFTs = ownedNfts.map((nft) => {
            return {
                tokenId: nft.tokenId,
                imageUri: nft.rawMetadata.image,
                tokenUri: nft.tokenUri.raw,
                nftAddress: collectionAddress,
            }
        })

        ///////////////////////////////////////
        //  Get inActive Items (Not On-Sale) //
        ///////////////////////////////////////

        // we display these tokens only for Seal contracts
        const inActiveItems = allNFTs.filter((nft) => {
            // Check if the tokenId of `nft` is not present in `activeItems`
            return !activeItems.some((item) => item.tokenId === nft.tokenId)
        })

        newData.inActiveItems = inActiveItems
    }

    ///////////////////////
    //  Get UI Elements  //
    ///////////////////////

    function getFirstNFTData() {
        const newDataArray = [
            ...newData.activeFixedPriceItems,
            ...newData.activeAuctionItems,
            ...(collectionData.sealContract ? newData.inActiveItems : []),
        ]

        console.log("newDataArray: ", newDataArray)

        return newDataArray[0]
    }

    async function getTokenUri(tokenId) {
        try {
            const provider = new ethers.providers.JsonRpcProvider(
                process.env.NEXT_PUBLIC_ALCHEMY_URL
            )
            const contract = new ethers.Contract(collectionAddress, nftAbi, provider)

            const tokenUri = await contract.tokenURI(tokenId)

            console.log("tokenUri_548: ", tokenUri)

            return tokenUri
        } catch (error) {
            console.log(error)
        }
    }

    async function getImageUri() {
        // check if all arrays in NFTListData are empty
        const noNFTs = Object.values(newData).every((array) => array.length === 0)

        if (noNFTs === true) {
            console.log(`${noNFTs} NFTListData passed from getServerSideProps is empty!`)
            return null
        }

        let tokenUri
        let nft = getFirstNFTData()

        if (collectionData.sealContract === true) {
            return nft.imageUri
        } else {
            try {
                tokenUri = await getTokenUri(nft.tokenId)

                if (tokenUri) {
                    const requestURL = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/")
                    const tokenUriResponse = await fetch(requestURL).then((res) => res.json())
                    const imageUriURL = tokenUriResponse.image
                    const imageUri = imageUriURL.replace("ipfs://", "https://ipfs.io/ipfs/")

                    return imageUri
                } else {
                    console.log("No tokenURI found for this NFT")
                }
            } catch (error) {
                console.log(error)
            }
        }
    }

    const imageUri = await getImageUri()
    console.log("imageUri_588: ", imageUri)

    const randomDescription =
        collectionDescriptions[Math.floor(Math.random() * collectionDescriptions.length)]
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]

    let profileData = { description: randomDescription, avatar: randomAvatar, imageUri: imageUri }

    console.log("newData: ", newData)
    console.log("collectionData: ", collectionData)
    console.log("profileData: ", profileData)

    return {
        props: { NFTListData: newData, collectionData, profileData },
    }
}

const CollectionInfoCard = ({ isOwner, collectionData, handleOpenMintModal }) => {
    const allowMint = collectionData.remainingSupply > 0

    const MintButtonStyle = {
        background: allowMint ? "#1677ff" : "grey",
        color: "white",
        // fontSize: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }

    return (
        <Row gutter={[16, 16]}>
            <Col span={4}>
                <Title type="secondary" level={5}>
                    Creator
                </Title>

                <Link href="/profile/[profile]" as={`/profile/${collectionData.contractDeployer}`}>
                    <a>
                        <Button shape="round">
                            {truncateStr(collectionData.contractDeployer, 15)}
                        </Button>
                    </a>
                </Link>
            </Col>
            <Col span={3}>
                <Title type="secondary" level={5}>
                    Symbol
                </Title>
                <Link href="/profile/[profile]" as={`/profile/${collectionData.contractDeployer}`}>
                    <a>
                        <Button shape="round">{collectionData.symbol}</Button>
                    </a>
                </Link>
            </Col>
            <Col span={3}>
                <Title type="secondary" level={5}>
                    Etherscan
                </Title>
                <Link href={`https://goerli.etherscan.io/address/${collectionData.address}`}>
                    <a target="_blank" style={{ display: "flex", alignItems: "center" }}>
                        <Image
                            preview={false}
                            src="/etherscan-logo-circle.png"
                            alt="Logo"
                            width={30}
                            height={30}
                        />
                    </a>
                </Link>
            </Col>
            {isOwner && collectionData.sealContract ? (
                <Col span={3}>
                    <div style={{ height: "30px" }}></div>
                    {allowMint ? (
                        <Button
                            style={MintButtonStyle}
                            disabled={false}
                            shape="round"
                            onClick={() => handleOpenMintModal()}
                        >
                            Mint Tokens
                        </Button>
                    ) : (
                        <Tooltip title="There are no NFTs left to mint in this collection">
                            <span>
                                <Button style={MintButtonStyle} disabled={true} shape="round">
                                    Mint Tokens
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Col>
            ) : null}
        </Row>
    )
}

const MintModal = ({
    supply,
    showMintModal,
    handleCloseMintModal,
    contractAddress,
    creatorAddress,
}) => {
    const [mintAmount, setMintAmount] = useState(0)
    const [loading, setLoading] = useState(0)

    const { runContractFunction } = useWeb3Contract()

    // Define the handle function for number input changes
    const handleNumberChange = (value) => {
        console.log("Value: ", value)
        setMintAmount(value)
    }

    const onFinish = () => {
        console.log("MINT THAT HSIT")
        console.log(mintAmount)

        mintNFT(mintAmount)
    }

    ///////////////
    //  Mint NFT //
    ///////////////

    async function mintNFT(mintAmount) {
        // don't stop loading until nft minted
        setLoading(true)
        console.log("Minting NFT now...")

        const transactionOptions = {
            abi: contractAbi,
            contractAddress: contractAddress,
            functionName: "mint",
            params: {
                mintAmount: mintAmount,
                _to: creatorAddress,
            },
        }

        const tx = await runContractFunction({
            params: transactionOptions,
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => console.log(error),
        })

        console.log("tx: ", tx)

        const receipt = await tx.wait(1)

        console.log("receipt: ", receipt)

        console.log(`NEW TOKEN MINTED BY ${creatorAddress}!`)

        message.success(`NFT Minted - View the NFT in your profile!`)

        setLoading(false)
        handleCloseMintModal()
    }

    return (
        <div>
            <Spin spinning={loading} tip="Minting">
                <Modal
                    title="Mint Tokens"
                    open={showMintModal}
                    onCancel={handleCloseMintModal}
                    footer={null}
                >
                    <Form onFinish={onFinish}>
                        <Form.Item
                            name="mintAmount"
                            label="Enter Mint Amount"
                            initialValue="1"
                            rules={[
                                {
                                    required: true,
                                    type: "number",
                                    max: supply,
                                    message:
                                        "Entered value exceeds the remaining NFTs in this collection.",
                                },
                            ]}
                        >
                            <InputNumber
                                min={1}
                                max={supply}
                                value={mintAmount}
                                onChange={handleNumberChange}
                            />
                        </Form.Item>

                        <Row justify="center">
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <Button onClick={handleCloseMintModal} style={{ marginRight: 20 }}>
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{ backgroundColor: "#1890ff" }}
                                >
                                    Finish
                                </Button>
                            </div>
                        </Row>
                    </Form>
                </Modal>
            </Spin>
        </div>
    )
}
