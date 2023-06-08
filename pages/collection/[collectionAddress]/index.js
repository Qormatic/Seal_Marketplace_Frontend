// This is the template for "NFT Collection Page"

import { GET_ACTIVE_ITEMS, GET_ACTIVE_COLLECTIONS } from "@/constants/subgraphQueries"
// import Image from "next/image"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
import { NFT_OnSaleFilter, NFT_CollectionFilter } from "@/components/Filter"
import NFTList from "@/components/NFTList"
import NFTList_OffSale from "@/components/NFTList_OffSale"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { avatars, collectionDescriptions } from "@/constants/fluff"
import contractFactoryAbi from "@/constants/MP_ContractFactory.json"
import { Fragment } from "react"
import nftAbi from "@/constants/BasicNft.json"
import { truncateStr } from "@/utils/truncate"
import Link from "next/link"
import { networkMapping } from "@/constants"
import { NftFilters, Alchemy, Network } from "alchemy-sdk"
import { ethers } from "ethers"

// import Image from "next/image"
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

    const { isWeb3Enabled, chainId } = useMoralis()
    const { runContractFunction } = useWeb3Contract()

    const allOnSaleNfts = [...NFTListData.activeFixedPriceItems, ...NFTListData.activeAuctionItems]

    ///////////////////////////////////
    //  Get Owners not On-Sale NFTs  //
    ///////////////////////////////////

    let offSaleNfts
    if (NFTListData.inActiveItems) {
        offSaleNfts = NFTListData.inActiveItems
    }

    ////////////////////////////////////
    //  For Sale/Not For Sale Filter  //
    ////////////////////////////////////

    // toggle show user NFT items or marcopolo collections
    const handleShowOnSale = () => {
        if (showOnSale) {
            setShowOnSale(false) // if showCollections is true, set it to false
        } else {
            setShowOnSale(true) // if showCollections is false, set it to true
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

    async function random_N(len) {
        return Math.floor(Math.random() * len) // random element picker
    }

    async function updateUI() {
        let tokenURI
        let len = await random_N(allOnSaleNfts.length)

        if (allOnSaleNfts[len].nftAddress) {
            let params = {
                abi: nftAbi,
                contractAddress: allOnSaleNfts[len].nftAddress,
                functionName: "tokenURI",
                params: {
                    tokenId: allOnSaleNfts[len].tokenId,
                },
            }

            tokenURI = await runContractFunction({ params: params })

            console.log("tokenURI: ", tokenURI)
        } else {
            tokenURI = offSaleNfts[random_N(offSaleNfts.length)].tokenUri
        }

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
            updateUI()
        }
        if (!allOnSaleNfts.length) {
            setShowOnSale(false)
        }
    }, [isWeb3Enabled])

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
                            ) : allOnSaleNfts.length > 0 ? (
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

    ///////////////////////////////
    //  Check if contract is MP  //
    ///////////////////////////////

    async function isMPContract(collectionAddress) {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL)
        const contract = new ethers.Contract(contractFactoryAddress, contractFactoryAbi, provider)

        try {
            const isMarcopoloContract = await contract.s_deployedContracts(collectionAddress)

            if (isMarcopoloContract === "0x0000000000000000000000000000000000000000") {
                return false
            } else {
                return isMarcopoloContract
            }
        } catch (error) {
            console.log("error: ", error)
        }
    }

    const isMarcopoloContract = await isMPContract(collectionAddress)

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
        supply: collection.totalSupply ?? "Unknown",
        contractDeployer:
            collection.contractDeployer ??
            (isMarcopoloContract !== false ? isMarcopoloContract : "Unknown"),
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
    if (isMarcopoloContract === false && activeItems.length === 0) {
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

    if (isMarcopoloContract !== false) {
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
        // const inActiveItems = allNFTs.filter((nft) => {
        //     // Check if the tokenId of `nft` is not present in `activeItems`
        //     return !activeItems.some((item) => item.tokenId === nft.tokenId)
        // })

        const inActiveItems = [
            {
                tokenId: "0",
                imageUri: "https://ipfs.io/ipfs/QmUqqBKUKz81wgewM7FK1RtZwwn1pc4vyy2Tqpi7YyWkqM",
                tokenUri: "https://ipfs.io/ipfs/QmWSvWTSfZD7hntgcsv4R66VmJqP7n4nfRsRs2YLuKUvte",
                nftAddress: collectionAddress,
            },
            {
                tokenId: "12",
                imageUri: "https://ipfs.io/ipfs/QmUqqBKUKz81wgewM7FK1RtZwwn1pc4vyy2Tqpi7YyWkqM",
                tokenUri: "https://ipfs.io/ipfs/QmWSvWTSfZD7hntgcsv4R66VmJqP7n4nfRsRs2YLuKUvte",
                nftAddress: collectionAddress,
            },
            {
                tokenId: "5",
                imageUri: "https://ipfs.io/ipfs/QmUqqBKUKz81wgewM7FK1RtZwwn1pc4vyy2Tqpi7YyWkqM",
                tokenUri: "https://ipfs.io/ipfs/QmWSvWTSfZD7hntgcsv4R66VmJqP7n4nfRsRs2YLuKUvte",
                nftAddress: collectionAddress,
            },
        ]

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
