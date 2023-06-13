// This is the My Collections page; listing the NFT a user owns

// import Head from "next/head" // using HEad allows us to set Metadata for a page which improves SEO
import styles from "@/styles/components.module.css"
// import { Form, useNotification, Button } from "web3uikit"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
import { useMoralis, useWeb3Contract, useNFTBalances } from "react-moralis"
import { useEffect, useState, useRef } from "react"
import { networkMapping } from "@/constants"
import { NFT_OnSaleFilter, NFT_WalletFilter, NFT_SellNftFilter } from "@/components/Filter"
import NFTList from "@/components/NFTList"
import CollectionList from "@/components/CollectionList"
import { ProfileHeader } from "@/components/Header"
import {
    Divider,
    Layout,
    Button,
    Space,
    Row,
    Col,
    Typography,
    Avatar,
    Image,
    Spin,
    Card,
} from "antd"
import nftMarketplaceAbi from "@/constants/MP_NFTMarketplace.json"
import { truncateStr, formatUnits } from "@/utils/truncate"
import { bios, avatars, backgroundImage } from "@/constants/fluff"
import { NftFilters, Alchemy, Network } from "alchemy-sdk"
import { ethers } from "ethers"

const mumbaiChain = "80001"
const marketplaceAddress = mumbaiChain ? networkMapping[mumbaiChain].NFTMarketplace[0] : null
const auctionAddress = mumbaiChain ? networkMapping[mumbaiChain].NFTAuction[0] : null

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

export default function Profile({
    onSaleNfts,
    profile,
    userCollections,
    profileData,
    userProceeds,
}) {
    const { account, chainId, isWeb3Enabled } = useMoralis()
    const [showOnSale, setShowOnSale] = useState(true)
    const [showSellButton, setShowSellButton] = useState(false)

    const [showAllActive, setShowAllActive] = useState(true)
    const [showAuction, setShowAuction] = useState(false)
    const [showFixedPrice, setShowFixedPrice] = useState(false)

    const [toSellNfts, setToSellNfts] = useState({ collectionNfts: [null], walletNfts: [null] })
    const [showCollections, setShowCollections] = useState(false)

    const [showAllInactive, setShowAllInactive] = useState(true)
    const [showPolo, setShowPolo] = useState(false)
    const [showExternal, setShowExternal] = useState(false)

    const [loading, setLoading] = useState(false)

    const previousAccount = useRef(null)

    const [userMPCollections, setUserMPCollections] = useState()

    const { runContractFunction } = useWeb3Contract()

    // get all contract addresses for user's MP collections
    // output will be array as [address1, address2, address3] or if has no contracts empty array
    const contractAddresses = userCollections.contractCreateds.map(
        (contract) => contract.contractAddress
    )

    const allOnSaleNfts = [...onSaleNfts.activeFixedPriceItems, ...onSaleNfts.activeAuctionItems] // [{}, {}, {}]

    console.log("contractAddresses_78: ", contractAddresses)
    console.log("allOnSaleNfts_79: ", allOnSaleNfts) // nftAddress && tokenId
    console.log("onSaleNfts_80: ", onSaleNfts)

    //////////////////////
    //  NFTs in Wallet  //
    //////////////////////

    // if user account matches profile, retrieve wallet NFT data
    // we don't get this info in getStaticProps because "account" is not available there
    const getUserNFTsAll = async () => {
        if (account === profile) {
            setShowSellButton(true)

            const alchemy = new Alchemy({
                apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
                network: Network.MATIC_MUMBAI,
                // network: Network.NEXT_PUBLIC_NETWORK,
            })

            try {
                const nfts = await alchemy.nft.getNftsForOwner(profile, {
                    pageSize: 20,
                })

                // remove any nfts from user's MP Collections addressess
                // const filteredNfts = nfts.ownedNfts.filter(
                //     (nft) => !contractAddresses.includes(nft.contract.address)
                // )

                const filteredNfts = nfts.ownedNfts.filter((nft) => {
                    // Condition 1 --> Remove any Marcopolo contract NFTs
                    const addressMatch = !contractAddresses.includes(nft.contract.address)

                    // Condition 2 --> Remove any already On Sale NFTs
                    const tokenIdAndAddressMatch = !allOnSaleNfts.some(
                        (onSaleNft) =>
                            onSaleNft.tokenId === nft.tokenId &&
                            onSaleNft.nftAddress === nft.contract.address
                    )

                    // If both conditions are true, keep the nft in the array
                    return addressMatch && tokenIdAndAddressMatch
                })

                console.log("filteredNfts: ", filteredNfts)

                const walletNfts = await getValidTokenUris(filteredNfts)

                setToSellNfts({ collectionNfts: [], walletNfts: walletNfts })
            } catch (error) {
                console.error(error)
            }

            try {
                if (contractAddresses.length > 0) {
                    const ownedCollectionNfts = await alchemy.nft.getNftsForOwner(profile, {
                        contractAddresses: contractAddresses,
                    })

                    const collectionNFTs = await getValidTokenUris(ownedCollectionNfts.ownedNfts)

                    setToSellNfts((prevData) => ({
                        collectionNfts: collectionNFTs,
                        walletNfts: prevData.walletNfts,
                    }))
                }
            } catch (error) {
                console.error(error)
            }
        }
    }

    const getUserMPCollectionsAll = async () => {
        if (account === profile) {
            const alchemy = new Alchemy({
                apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
                network: Network.MATIC_MUMBAI,
            })

            try {
                const allCollectionsData = await alchemy.nft.getContractMetadataBatch(
                    contractAddresses
                )

                setUserMPCollections(allCollectionsData)
            } catch (error) {
                console.error(error)
            }
        }
    }

    const isTokenUriValid = async (tokenUri) => {
        const timeout = 1000
        const controller = new AbortController()
        const signal = controller.signal

        const timeoutId = setTimeout(() => {
            controller.abort()
        }, timeout)

        try {
            const response = await fetch(tokenUri, { signal })
            clearTimeout(timeoutId)

            if (response.status === 404) {
                console.log("Token URI not found.")
                return false
            } else if (response.status === 504) {
                console.log("Gateway Timeout.")
                return false
            }
            return response.ok
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Request timed out.")
            }
            return false
        }
    }

    const getValidTokenUris = async (nfts) => {
        console.log("nfts_106: ", nfts)
        const validNfts = await Promise.all(
            nfts
                .filter((nft) => nft.tokenType !== "ERC1155")
                .map(async (nft) => {
                    try {
                        const isUriValid = await isTokenUriValid(nft.tokenUri.gateway)
                        console.log(
                            `Token URI for NFT with tokenId ${nft.tokenId} is ${
                                isUriValid ? "valid" : "invalid"
                            }`
                        )

                        if (isUriValid) {
                            return {
                                nftAddress: nft.contract.address,
                                contractName: nft.contract.name,
                                contractSymbol: nft.contract.symbol,
                                contractDeployer: nft.contract.contractDeployer,
                                tokenId: nft.tokenId,
                                tokenType: nft.tokenType,
                                name: nft.title,
                                description: nft.description,
                                imageUri: nft.rawMetadata.image,
                                tokenUri: nft.tokenUri.gateway.replace(
                                    "ipfs://",
                                    "https://ipfs.io/ipfs/"
                                ),
                            }
                        } else {
                            return undefined
                        }
                    } catch (error) {
                        console.error(error)
                    }
                })
        )

        return validNfts.filter((nft) => nft !== undefined)
    }

    /////////////////////////
    //  Withdraw Proceeds  //
    /////////////////////////

    async function handleWithdrawProceeds() {
        setLoading(true)

        console.log("BUTTON CLICK")

        const withdrawOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "withdrawProceeds",
            params: {},
        }

        const tx = await runContractFunction({
            params: withdrawOptions,
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => console.log(error),
        })

        console.log("tx: ", tx)

        const receipt = await tx.wait(1)

        console.log("receipt: ", receipt)

        setLoading(false)
        message.success(`Funds Withdrawn!`)
        window.location.reload()
    }

    ///////////////////////////////
    //  NFTs/Collections Filter  //
    ///////////////////////////////

    // toggle show user NFT items or marcopolo collections
    const handleShowCollections = () => {
        if (showCollections) {
            setShowCollections(false) // if showCollections is true, set it to false
        } else {
            setShowCollections(true) // if showCollections is false, set it to true
        }
    }

    const NFTsButtonStyle = {
        background: !showCollections ? "black" : "white",
        color: !showCollections ? "white" : "black",
        fontSize: "20px",
        marginLeft: "5px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }

    const CollectionsButtonStyle = {
        borderRadius: "20px",
        background: showCollections ? "black" : "white",
        color: showCollections ? "white" : "black",
        fontSize: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }

    //////////////////////////////
    //  On sale/To Sell Filter  //
    //////////////////////////////

    // toggle show user items listed on the marketplace or in their wallet but not listed on marketplace
    const handleShowOnSaleItems = () => {
        if (showOnSale) {
            setShowOnSale(false) // if showOnSale is true, set it to false
            setShowAllActive(false)
            setShowAuction(false)
            setShowFixedPrice(false)
        } else {
            setShowOnSale(true) // if showOnSale is false, set it to true
            setShowAllInactive(false)
            setShowPolo(false)
            setShowExternal(false)
        }
    }

    ////////////////////////////
    //  On sale Filter Button //
    ////////////////////////////

    const handleShowAllActive = () => {
        setShowAllActive(true)
        setShowAuction(false)
        setShowFixedPrice(false)
    }

    const handleFixedPriceFilter = () => {
        setShowFixedPrice(true)
        setShowAllActive(false)
        setShowAuction(false)
    }

    const handleAuctionFilter = () => {
        setShowAuction(true)
        setShowAllActive(false)
        setShowFixedPrice(false)
    }

    //////////////////////////////
    //  To Sell Filter Buttons  //
    //////////////////////////////

    const handleShowAllInactive = () => {
        setShowAllInactive(true)
        setShowExternal(false)
        setShowPolo(false)
    }

    const handleExternalFilter = () => {
        setShowExternal(true)
        setShowAllInactive(false)
        setShowPolo(false)
    }

    const handlePoloFilter = () => {
        setShowPolo(true)
        setShowAllInactive(false)
        setShowExternal(false)
    }

    /////////////////////
    //  NFT List Data  //
    /////////////////////

    const allToSellNfts = [...toSellNfts.collectionNfts, ...toSellNfts.walletNfts] // [{}, {}, {}]

    console.log("allOnSaleNfts: ", allOnSaleNfts)
    console.log("allToSellNfts: ", allToSellNfts)

    // filtering of On Sale NFTs
    const filteredOnSaleNfts = showFixedPrice
        ? onSaleNfts.activeFixedPriceItems
        : showAuction
        ? onSaleNfts.activeAuctionItems
        : allOnSaleNfts

    // filtering of To Sell NFTs
    const filteredToSellNfts = showExternal
        ? toSellNfts.walletNfts
        : showPolo
        ? toSellNfts.collectionNfts
        : allToSellNfts

    // which NFT list data to show
    const NFTListData = showOnSale ? filteredOnSaleNfts : filteredToSellNfts

    useEffect(() => {
        if (account) {
            getUserNFTsAll()
            getUserMPCollectionsAll()
        }
    }, [account])

    useEffect(() => {
        if (previousAccount.current && previousAccount.current !== account) {
            // we use useRef to define previousAccount.current and check if it matches the new account.
            // reload page if not so we can hide user's private nft data
            window.location.reload()
        }
        previousAccount.current = account
        console.log("previousAccount: ", previousAccount)
    }, [account])

    return (
        <Spin spinning={!toSellNfts}>
            <div>
                <Layout style={{ background: "#fff" }}>
                    <div
                        style={{
                            backgroundImage: profileData[1],
                            position: "relative",
                        }}
                    >
                        {/* removing "position" altogether will cover the header with the image" */}
                        <ProfileHeader style={{ position: "relative" }} />

                        <div
                            style={{
                                height: "140px",
                                width: "200px",
                            }}
                        ></div>
                    </div>
                    <div style={{ padding: "50px" }}>
                        <Content>
                            <div>
                                <Avatar shape="circle" size={160} src={profileData[2]} />
                                <Row gutter={[30, 30]}>
                                    <Col span={12}>
                                        <Title level={4} style={{ paddingTop: "14px" }}>
                                            @{truncateStr(profile, 15)}
                                        </Title>
                                        <Title style={{ marginBottom: "0px" }} level={2}>
                                            Bio
                                        </Title>
                                    </Col>
                                </Row>
                                <Row gutter={[30, 30]}>
                                    <Col span={12}>
                                        <Divider
                                            style={{ marginBottom: "15px", padding: "0px" }}
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={[30, 30]}>
                                    <Col span={12}>
                                        <Text style={{ color: "black", fontSize: "50" }}>
                                            {profileData[0]}
                                        </Text>
                                    </Col>
                                    {profile === account && (
                                        <Col span={12}>
                                            <ProceedsDisplay
                                                userProceeds={userProceeds}
                                                handleWithdrawProceeds={handleWithdrawProceeds}
                                            />
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        </Content>
                        <div>
                            <Space style={{ paddingTop: "20px" }}>
                                <Button
                                    shape="round"
                                    size="large"
                                    style={NFTsButtonStyle}
                                    onClick={() => handleShowCollections()}
                                >
                                    Wallet NFTs
                                    {/* <Title
                                        level={2}
                                        style={{
                                            margin: 0,
                                            color: !showCollections ? "white" : "black",
                                        }}
                                    >
                                        Wallet NFTs
                                    </Title> */}
                                </Button>
                                <Button
                                    shape="round"
                                    size="large"
                                    style={CollectionsButtonStyle}
                                    onClick={() => handleShowCollections()}
                                >
                                    Marcopolo Collections
                                    {/* <Title
                                        level={2}
                                        style={{
                                            margin: 0,
                                            color: showCollections ? "white" : "black",
                                        }}
                                    >
                                        Marcopolo Collections
                                    </Title> */}
                                </Button>
                            </Space>
                            {!showCollections ? (
                                <NFTs
                                    showOnSale={showOnSale}
                                    handleShowOnSaleItems={handleShowOnSaleItems}
                                    showSellButton={showSellButton}
                                    onSaleNfts={onSaleNfts}
                                    allOnSaleNfts={allOnSaleNfts}
                                    allToSellNfts={allToSellNfts}
                                    toSellNfts={toSellNfts}
                                    handleFixedPriceFilter={handleFixedPriceFilter}
                                    handleAuctionFilter={handleAuctionFilter}
                                    handleShowAllActive={handleShowAllActive}
                                    handleShowAllInactive={handleShowAllInactive}
                                    handleExternalFilter={handleExternalFilter}
                                    handlePoloFilter={handlePoloFilter}
                                    showFixedPrice={showFixedPrice}
                                    showAuction={showAuction}
                                    showAllActive={showAllActive}
                                    showAllInactive={showAllInactive}
                                    showPolo={showPolo}
                                    showExternal={showExternal}
                                    NFTListData={NFTListData}
                                />
                            ) : (
                                <Collections userMPCollections={userMPCollections} />
                            )}
                        </div>
                    </div>
                    <Footer />
                </Layout>
            </div>
        </Spin>
    )
}

const NFTs = ({
    showOnSale, // already on sale or in wallet not on sale
    handleShowOnSaleItems,
    showSellButton, // show sell button in filter NFT_WalletFilter if it's the user's profile

    // data
    onSaleNfts, // get user fixed price and auction items (in one object; two arrays)
    allOnSaleNfts, // get user fixed price and auction items (in one array)
    allToSellNfts, // all nfts in users wallet from alchemy sdk
    toSellNfts,
    NFTListData,

    // On Sale bools
    showAllActive,
    showFixedPrice,
    showAuction,

    // To Sell bools
    showAllInactive,
    showExternal,
    showPolo,

    // On Sale handlers
    handleFixedPriceFilter,
    handleAuctionFilter,
    handleShowAllActive,

    // To Sell handlers
    handleShowAllInactive,
    handleExternalFilter,
    handlePoloFilter,
}) => {
    const { chainId, isWeb3Enabled } = useMoralis()

    return (
        <>
            <Row style={{ paddingTop: "0px" }}>
                <Divider style={{ width: "100%" }} />
                <div>
                    <NFT_WalletFilter
                        handleShowOnSaleItems={handleShowOnSaleItems}
                        showOnSale={showOnSale}
                        showSellButton={showSellButton}
                    />
                </div>{" "}
                <Divider style={{ width: "100%" }} />
            </Row>
            {isWeb3Enabled && chainId ? (
                <>
                    <div>
                        {showOnSale ? (
                            <NFT_OnSaleFilter
                                fixedNftsLength={onSaleNfts?.activeFixedPriceItems?.length || 0}
                                auctionNftsLength={onSaleNfts?.activeAuctionItems?.length || 0}
                                allNftsLength={allOnSaleNfts.length}
                                handleFixedPriceFilter={handleFixedPriceFilter}
                                handleAuctionFilter={handleAuctionFilter}
                                handleShowAllActive={handleShowAllActive}
                                showFixedPrice={showFixedPrice}
                                showAuction={showAuction}
                                showAllActive={showAllActive}
                            />
                        ) : (
                            <NFT_SellNftFilter
                                walletNftsLength={toSellNfts.walletNfts.length}
                                collectionNftsLength={toSellNfts.collectionNfts.length}
                                allNftsLength={allToSellNfts.length}
                                handleExternalFilter={handleExternalFilter}
                                handlePoloFilter={handlePoloFilter}
                                handleShowAllInactive={handleShowAllInactive}
                                showAllInactive={showAllInactive}
                                showExternal={showExternal}
                                showPolo={showPolo}
                            />
                        )}
                    </div>
                    {!NFTListData.length ? (
                        <div style={{ margin: "10px" }}>
                            <Title level={3}>Looks like you have no NFTs here!</Title>
                        </div>
                    ) : (
                        <div>
                            <NFTList NFTListData={NFTListData} showOnSale={showOnSale} />
                        </div>
                    )}
                </>
            ) : (
                <div>Web3 Currently Not Enabled</div>
            )}
        </>
    )
}

const Collections = ({ userMPCollections }) => {
    const { chainId, isWeb3Enabled } = useMoralis()

    console.log("userMPCollections_564: ", userMPCollections)

    return (
        <>
            <Row style={{ paddingTop: "0px" }}>
                <Divider style={{ width: "100%" }} />
            </Row>
            {isWeb3Enabled && chainId ? (
                <div>
                    {!userMPCollections ? (
                        <div style={{ margin: "10px" }}>
                            <Title level={3}>Looks like you have no Marcopolo Collections!</Title>
                        </div>
                    ) : (
                        <CollectionList userMPCollections={userMPCollections} />
                    )}
                </div>
            ) : (
                <div>Web3 Currently Not Enabled</div>
            )}
        </>
    )
}

const ProceedsDisplay = ({ userProceeds, handleWithdrawProceeds }) => {
    const disableButton = userProceeds === "0.0"

    return (
        <Card className="proceedsCard">
            <Title type="secondary" level={4}>
                Available Funds
            </Title>
            <Title level={3} style={{ margin: 0 }}>
                {userProceeds} ETH
            </Title>
            <Button
                shape="round"
                type="primary"
                size="large"
                block
                style={{ marginTop: "10px" }}
                disabled={disableButton}
                className={`${styles["sale-card-button"]} ${disableButton ? styles.disabled : ""}`}
                onClick={() => handleWithdrawProceeds()}
            >
                {" "}
                Withdraw Now
            </Button>
        </Card>
    )
}

export async function getServerSideProps({ params }) {
    let { profile } = params || {}
    console.log("params: ", params)

    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    ////////////////////
    //  NFTs on Site  //
    ////////////////////

    const GET_USER_ACTIVE_ITEMS = gql`
    {
        activeFixedPriceItems(where: { seller: "${profile}", 
        buyer: "0x0000000000000000000000000000000000000000"}) {
        id
        buyer
        seller
        nftAddress
        price
        tokenId
    }
    activeAuctionItems(where: {
        seller: "${profile}",
        endTime_gt: ${Math.floor(Date.now() / 1000)}}) {
        buyer
        endTime
        highestBid
        id
        nftAddress
        reservePrice
        seller
        startTime
        tokenId
    }
    }
    `

    const { data } = await client.query({
        query: GET_USER_ACTIVE_ITEMS,
    })

    let onSaleNfts = data

    ///////////////////////////
    //  User MP Collections  //
    ///////////////////////////

    const GET_USER_COLLECTIONS = gql`
    {
        contractCreateds(where: { owner: "${profile}" }) {
        id
        contractAddress
        owner
    }
    }`

    const collections = await client.query({
        query: GET_USER_COLLECTIONS,
    })

    // console.log("collections: ", collections)

    const userCollections = collections.data

    // console.log("userCollections: ", userCollections)

    ///////////////////////
    //  getUserProceeds  //
    ///////////////////////

    async function getUserProceeds(profile) {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL)
        const contract = new ethers.Contract(marketplaceAddress, nftMarketplaceAbi, provider)

        try {
            const proceeds = await contract.getProceeds(profile)
            const formattedProceeds = ethers.BigNumber.from(proceeds).toString()

            return formatUnits(formattedProceeds)
        } catch (error) {
            console.log("error: ", error)
        }
    }

    const userProceeds = await getUserProceeds(profile)

    ///////////////////////
    //  Get UI Elements  //
    ///////////////////////

    const randomBio = bios[Math.floor(Math.random() * bios.length)]
    const randomBackground = backgroundImage[Math.floor(Math.random() * backgroundImage.length)]
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]

    let profileData = [randomBio, randomBackground, randomAvatar]

    return {
        props: {
            onSaleNfts,
            profile,
            userCollections,
            profileData,
            userProceeds,
        },
    }
}
