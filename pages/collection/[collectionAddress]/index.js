// This is the template for "NFT Collection Page"

import { GET_ACTIVE_ITEMS, GET_ACTIVE_COLLECTIONS } from "@/constants/subgraphQueries"
// import Image from "next/image"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
import { NFT_OnSaleFilter, NFT_CollectionFilter } from "@/components/Filter"
import NFTList from "@/components/NFTList"
import NFTList_OffSale from "@/components/NFTList_OffSale"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { avatars, collectionDescriptions } from "@/constants/fluff"
import contractFactoryAbi from "@/constants/Seal_ContractFactory.json"
import contract721Abi from "@/constants/Seal_721_Contract.json"
import { Fragment } from "react"
import nftAbi from "@/constants/BasicNft.json"
import { truncateStr } from "@/utils/truncate"
import Link from "next/link"
import { networkMapping } from "@/constants"
import { NftFilters, Alchemy, Network } from "alchemy-sdk"
import { ethers } from "ethers"

import { useEffect, useState } from "react"
import { Layout, Row, Col, Typography, Image, Card, Space, Button, Avatar, Divider } from "antd"

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography
const mumbaiChain = "80001"
const contractFactoryAddress = mumbaiChain ? networkMapping[mumbaiChain].ContractFactory[0] : null

export default function CollectionPage({ NFTListData, collectionData, profileData }) {
    const [imageURI, setImageURI] = useState("")
    const [showOnSale, setShowOnSale] = useState(true)
    const [showAll, setShowAll] = useState(true)
    const [showAuction, setShowAuction] = useState(false)
    const [showFixedPrice, setShowFixedPrice] = useState(false)
    const [isOwner, setIsOwner] = useState()

    const { isWeb3Enabled, chainId, account } = useMoralis()
    const { runContractFunction } = useWeb3Contract()

    const allOnSaleNfts = [...NFTListData.activeFixedPriceItems, ...NFTListData.activeAuctionItems]

    ///////////////////////////////////
    //  Get Owners not On-Sale NFTs  //
    ///////////////////////////////////

    let offSaleNfts
    if (NFTListData.inActiveItems) {
        offSaleNfts = NFTListData.inActiveItems
    }

    // console.log("NFTListData: ", NFTListData)
    // console.log("allOnSaleNfts: ", allOnSaleNfts)
    // console.log("offSaleNfts: ", offSaleNfts)
    // console.log("collectionData: ", collectionData)
    // console.log("profileData: ", profileData)

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

    ///////////////////////////
    //  Set Owner/Not Owner  //
    ///////////////////////////

    // toggle if current user is the collection owner
    const handleSetOwner = () => {
        if (isOwner) {
            setIsOwner(false) // if isOwner is true, set it to false
        } else {
            setIsOwner(true) // if isOwner is false, set it to true
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
        const noNFTs = Object.values(NFTListData).every((array) => array.length === 0)

        // if (!allOnSaleNfts.length) {
        //     setShowOnSale(false) // filter offSale NFTs if there are no onSale
        // }

        if (noNFTs === true) {
            console.log(`${noNFTs} NFTListData passed from getServerSideProps is empty!`)
            return
        }

        let tokenURI
        let nft

        if (allOnSaleNfts.length > 0) {
            nft = allOnSaleNfts[0]

            if (nft.nftAddress) {
                const params = {
                    abi: nftAbi,
                    contractAddress: nft.nftAddress,
                    functionName: "tokenURI",
                    params: {
                        tokenId: nft.tokenId,
                    },
                }

                tokenURI = await runContractFunction({ params: params })
            }
        }

        if (!tokenURI && offSaleNfts.length > 0) {
            nft = offSaleNfts[0]
            tokenURI = nft.tokenUri
        }

        console.log("tokenURI: ", tokenURI)

        if (tokenURI) {
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await fetch(requestURL).then((res) => res.json())
            const imageURI = tokenURIResponse.image
            const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            setImageURI(imageURIURL)
        } else {
            console.log("No tokenURI found for this NFT")
        }
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
                            <Image
                                src={imageURI || "../../images/placeholder.png"}
                                alt="Placeholder image"
                                width={300}
                                height={300}
                            />
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
                                        {profileData[0]}
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
        </div>
    )
}

const CollectionInfoCard = ({ isOwner, collectionData }) => {
    const MintButtonStyle = {
        background: collectionData.remainingSupply ? "blue" : "grey",
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
            {!isOwner ? (
                <Col span={3}>
                    {/* <Title type="secondary" level={5}>
                        {"Mint"}
                    </Title> */}
                    <div style={{ height: "30px" }}></div>
                    <Button
                        style={MintButtonStyle}
                        disabled={collectionData.remainingSupply}
                        shape="round"
                    >
                        Mint Token
                    </Button>
                </Col>
            ) : null}
        </Row>
    )
}

export async function getServerSideProps({ params }) {
    const { collectionAddress } = params || {}

    //////////////////////////
    //  Active Items Query  //
    //////////////////////////

    const GET_ACTIVE_COLLECTION_ITEMS = gql`
    {
        activeFixedPriceItems(
            first: 100, 
            where: { buyer: "0x0000000000000000000000000000000000000000",
            nftAddress: "${collectionAddress}" } # buyer == zeroAddress as this means it is unsold
        ) {
            id
            buyer
            seller
            nftAddress
            tokenId
            price
        }
        activeAuctionItems(
            first: 100,
            where: { endTime_gt: ${Math.floor(Date.now() / 1000)},
            nftAddress: "${collectionAddress}", } # endTime > now
) {
            id
            nftAddress
            tokenId
            seller
            reservePrice
            startTime
            endTime
            buyer
            highestBid
            resulted
            canceled
        }
    }
`

    ////////////////////////////////////////////////////
    // Check if contract is MP & has remaining tokens //
    ////////////////////////////////////////////////////

    async function checkMPContract(collectionAddress) {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL)
        const contractFactory = new ethers.Contract(
            contractFactoryAddress,
            contractFactoryAbi,
            provider
        )

        try {
            const deployerAddress = await contractFactory.s_deployedContracts(collectionAddress)

            if (deployerAddress === "0x0000000000000000000000000000000000000000") {
                return { contractDeployer: false }
            } else {
                // Assuming you have the ABI for the collectionAddress contract
                const collectionContract = new ethers.Contract(
                    collectionAddress,
                    contract721Abi,
                    provider
                )

                const maxSupply = await collectionContract.s_maxSupply() // total amount allowed to be minted
                const totalSupply = await collectionContract.s_totalSupply() // current amount that has been minted

                const difference = maxSupply.sub(totalSupply)
                const remainingSupply = difference.gt(0) // checks if difference is greater than 0

                // Return the difference
                return { contractDeployer: deployerAddress, remainingSupply: remainingSupply }
            }
        } catch (error) {
            console.log("error: ", error)
        }
    }

    const mpCheck = await checkMPContract(collectionAddress)
    console.log("mpCheck: ", mpCheck)

    //////////////////////////////
    //  Collection Information  //
    //////////////////////////////

    const alchemy = new Alchemy({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        network: Network.MATIC_MUMBAI,
    })

    const collection = await alchemy.nft.getContractMetadata(collectionAddress, {
        // excludeFilters: [NftFilters.SPAM],
    })

    console.log("collection: ", collection)

    const collectionData = {
        address: collection.address,
        name: collection.name,
        symbol: collection.symbol,
        tokenType: collection.tokenType,
        remainingSupply: mpCheck.remainingSupply,
        contractDeployer:
            collection.contractDeployer ??
            (mpCheck.contractDeployer !== false ? mpCheck.contractDeployer : "Unknown"),
    }

    console.log("collectionData: ", collectionData)

    /////////////////////////
    //  Get On-Sale Items  //
    /////////////////////////

    // "context" contains the parameters used to create the current route user is on
    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const { data } = await client.query({
        query: GET_ACTIVE_COLLECTION_ITEMS,
    })

    let newData = { ...data } // create new var bcos "data" is not editable

    const activeItems = [...data.activeFixedPriceItems, ...data.activeAuctionItems]

    console.log("activeItems: ", activeItems)

    //////////////////////
    //  Redirect to 500  //
    //////////////////////

    // if the collection is not MP and it has no On-Sale items; redirect user to 500 page
    if (mpCheck.contractDeployer === false && activeItems.length === 0) {
        return {
            redirect: {
                destination: "/500",
                permanent: false,
            },
        }
    }

    ////////////////////////////////////
    //  Get all NFTs for MP contract  //
    ////////////////////////////////////

    if (mpCheck.contractDeployer !== false) {
        const { ownedNfts } = await alchemy.nft.getNftsForOwner(collectionData.contractDeployer, {
            contractAddresses: [collectionAddress],
            omitMetadata: false,
        })

        // console.log("ownedNfts: ", ownedNfts)

        const allNFTs = ownedNfts.map((nft) => {
            return {
                tokenId: nft.tokenId,
                imageUri: nft.rawMetadata.image,
                tokenUri: nft.tokenUri.raw,
                nftAddress: collectionAddress,
            }
        })

        // console.log("allNFTs: ", allNFTs)

        ///////////////////////////////////////
        //  Get inActive Items (Not On-Sale) //
        ///////////////////////////////////////

        // we display these tokens only for MP contracts
        const inActiveItems = allNFTs.filter((nft) => {
            // Check if the tokenId of `nft` is not present in `activeItems`
            return !activeItems.some((item) => item.tokenId === nft.tokenId)
        })

        newData.inActiveItems = inActiveItems
    }

    ///////////////////////
    //  Get UI Elements  //
    ///////////////////////

    const randomDescription =
        collectionDescriptions[Math.floor(Math.random() * collectionDescriptions.length)]
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]

    let profileData = [randomDescription, randomAvatar]

    return {
        props: { NFTListData: newData, collectionData, profileData },
    }
}
