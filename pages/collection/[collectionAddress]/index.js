// This is the template for "NFT Collection Page"

import { GET_ACTIVE_ITEMS, GET_ACTIVE_COLLECTIONS } from "@/constants/subgraphQueries"
// import Image from "next/image"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
import { NFT_OnSaleFilter } from "@/components/Filter"
import NFTList from "@/components/NFTList"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { avatars, collectionDescriptions } from "@/constants/fluff"
import { Fragment } from "react"
import nftAbi from "@/constants/BasicNft.json"
import { truncateStr } from "@/utils/truncate"
import Link from "next/link"
import { NftFilters, Alchemy, Network } from "alchemy-sdk"

// import Image from "next/image"
import { useEffect, useState } from "react"
import { Layout, Row, Col, Typography, Image, Card, Space, Button, Avatar, Divider } from "antd"
const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

export default function CollectionPage({ NFTListData, collectionData, profileData }) {
    const [imageURI, setImageURI] = useState("")
    const { isWeb3Enabled, chainId } = useMoralis()
    const [showOnSale, setShowOnSale] = useState(true)
    const [showAll, setShowAll] = useState(true)
    const [showAuction, setShowAuction] = useState(false)
    const [showFixedPrice, setShowFixedPrice] = useState(false)

    console.log("NFTListData: ", NFTListData)

    const allOnSaleNfts = [...NFTListData.activeFixedPriceItems, ...NFTListData.activeAuctionItems]
    const randomNft = Math.floor(Math.random() * allOnSaleNfts.length) // use randomNft from collection as the NFT to display on the page

    //////////////////////
    //  Filter Buttons  //
    //////////////////////

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

    ////////////////////
    //  Get imageURI  //
    ////////////////////

    const result = useWeb3Contract({
        abi: nftAbi,
        contractAddress: allOnSaleNfts[randomNft].nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: allOnSaleNfts[randomNft].tokenId,
        },
    })

    async function updateUI() {
        let getTokenURI

        if (allOnSaleNfts[randomNft].nftAddress) {
            getTokenURI = result.runContractFunction
        }

        const tokenURI = await getTokenURI()
        if (tokenURI) {
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json()
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
        if (isWeb3Enabled) {
            if (allOnSaleNfts.length) {
                // console.log("allOnSaleNfts: ", allOnSaleNfts)
                updateUI()
            }
        }
    }, [isWeb3Enabled])

    console.log("collectionData: ", collectionData)

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
                                {collectionData.name} Collection
                            </Title>
                            {/* can use gutter in row instead of span in col */}
                            <CollectionInfoCard collectionData={collectionData} />
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
                        {isWeb3Enabled && chainId ? (
                            allOnSaleNfts.length > 0 ? (
                                <Fragment>
                                    <div>
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
                                            showAll={showAll}
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
                                    It looks like this collection currently has no NFTs for sale!
                                </div>
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

const CollectionInfoCard = ({ collectionData }) => {
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
        </Row>
    )
}

export async function getServerSideProps({ params }) {
    const { collectionAddress } = params || {}

    ////////////////////////////////
    //  Collection Items on Sale  //
    ////////////////////////////////

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

    // "context" contains the parameters used to create the current route user is on
    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const { data } = await client.query({
        query: GET_ACTIVE_COLLECTION_ITEMS,
    })

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

    const collectionData = {
        address: collection.address,
        name: collection.name,
        symbol: collection.symbol,
        tokenType: collection.tokenType,
        contractDeployer: collection.contractDeployer ?? "Marcopolo",
    }

    ///////////////////////
    //  Get UI Elements  //
    ///////////////////////

    const randomDescription =
        collectionDescriptions[Math.floor(Math.random() * collectionDescriptions.length)]
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]

    let profileData = [randomDescription, randomAvatar]

    console.log(profileData)

    return { props: { NFTListData: data, collectionData, profileData } }
}

// export async function getStaticPaths() {
//     const client = new ApolloClient({
//         cache: new InMemoryCache(),
//         uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
//     })

//     const { data } = await client.query({
//         query: GET_ACTIVE_COLLECTIONS,
//     })

//     console.log("data: ", data)

//     const allItems = [
//         ...data.activeFixedPriceItems,
//         ...data.activeAuctionItems,
//         ...data.contractCreateds,
//     ]

//     // get unique addresses for MP collections and external collections
//     const uniqueItems = [
//         ...new Set(
//             allItems.map(({ contractAddress, nftAddress }) => contractAddress || nftAddress)
//         ),
//     ]

//     const allPaths = uniqueItems.map((item) => {
//         return {
//             params: {
//                 collectionAddress: item,
//             },
//         }
//     })

//     return {
//         paths: allPaths, // tell app which routes to create in build time
//         fallback: false,
//         // fallback: true, // tell app to create route if it doesn't exist and serve a "fallback" page version while it's being created
//         // fallback: blocking, // tell app to create route if it doesn't exist and wait for it to be created
//         // fallback: false, // user puts in an incorrect route; 404 will be returned
//     }
// }
