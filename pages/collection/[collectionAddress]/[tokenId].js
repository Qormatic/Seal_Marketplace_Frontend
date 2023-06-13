// This is the template for "Individual NFT Page"

import {
    GET_TOKEN_HISTORY,
    GET_ACTIVE_ITEMS,
    GET_TOKEN_ACTIVE_ITEMS,
} from "@/constants/subgraphQueries"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
// import client from "../_app"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { useNotification } from "web3uikit"
import nftAbi from "@/constants/BasicNft.json"
import nftAuctionAbi from "@/constants/MP_NFTAuction.json"
import { networkMapping } from "@/constants"
import styles from "@/styles/components.module.css"
import { ethers } from "ethers"
import Link from "next/link"
import TokenModal from "@/components/TokenModal"
import { useEffect, useState } from "react"
import { NftFilters, Alchemy, Network, Utils } from "alchemy-sdk"
import {
    Layout,
    Row,
    Col,
    Image,
    Typography,
    Card,
    Button,
    Avatar,
    Divider,
    Space,
    List,
    message,
    Statistic,
    notification,
} from "antd"
import { truncateStr, formatUnits } from "@/utils/truncate"

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography
const { Countdown } = Statistic

export default function NFTPage({ data, tokenProvenance }) {
    const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [collectionName, setCollectionName] = useState("")
    const [attributes, setAttributes] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [auctionFinished, setAuctionFinished] = useState(false)
    const {
        id,
        nftAddress,
        tokenId,
        price,
        reservePrice,
        startTime,
        endTime,
        highestBid,
        resulted,
        canceled,
        seller,
        buyer, // highestBidder while auction open, winningBidder if auction closed, 0x0 if no bids
        __typename,
    } = data

    console.log("reservePrice: ", reservePrice)
    console.log("buyer: ", buyer)
    console.log("account: ", account)
    const userIsHighbidder = buyer === account
    const userIsSeller = seller === account || seller === undefined
    const formattedSellerAddress = userIsSeller ? "You" : truncateStr(seller || "", 15)

    const AVATAR_URL = "https://example.com/avatar1.jpg"

    const { runContractFunction } = useWeb3Contract()

    const { chainId } = useMoralis()

    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const auctionAddress = chainId ? networkMapping[chainString].NFTAuction[0] : null

    /////////////////
    //  Set up UI  //
    /////////////////

    async function updateUI() {
        const tokenURI = await getTokenURI()
        const collectionName = await getName()

        // We cheat a little here on decentralization by using an IPFS Gateway instead of IPFS directly because not all browsers are IPFS compatible
        // Rather than risk our FE showing blank images on some browsers, we update tokenURIs where "IPFS://" is detected to "HTTPS://"
        // The gateway "https://ipfs.io/ipfs/" is provided by the IPFS team
        // The other solution would be to store the image on a server (like Moralis) and call from there
        if (tokenURI) {
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const { image, name, description, attributes } = await (await fetch(requestURL)).json()
            console.log("attributes", attributes)
            setImageURI(image.replace("ipfs://", "https://ipfs.io/ipfs/"))
            setTokenName(name)
            setTokenDescription(description)
            setCollectionName(collectionName)
            setAttributes(attributes)
        }
    }

    // define the getTokenURI function call we need to interact with the NFT's contract
    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    // define the getTokenURI function call we need to interact with the NFT's contract
    const { runContractFunction: getName } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "name",
        params: {},
    })

    /////////////////////////
    //  getAuctionEndTime  //
    /////////////////////////

    const onFinish = () => {
        console.log("finished!")
    }

    /////////////////////////
    //  handleButtonClick  //
    /////////////////////////

    const handleButtonClick = (title) => {
        console.log("title: ", title)

        if (title === "Buy Now") {
            // Open tokenModal (fixed price view)
            setShowModal((showModal) => !showModal)
        } else if (title === "Place Bid") {
            // Open tokenModal (auction view)
            setShowModal((showModal) => !showModal)
        } else if (title === "Cancel Auction") {
            // Run cancelAuction() function
            handleCancelAuction()
        } else if (title === "Result Auction") {
            // Run resultAuction() function
            handleResultAuction()
        }
    }

    ///////////////////////
    //  cancelAuction()  //
    ///////////////////////

    async function handleCancelAuction() {
        setLoading(true)

        const cancelOptions = {
            abi: nftAuctionAbi,
            contractAddress: auctionAddress,
            functionName: "cancelAuction",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
            },
        }

        const tx = await runContractFunction({
            params: cancelOptions,
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => console.log(error),
        })

        console.log("tx: ", tx)

        const receipt = await tx.wait(1)

        console.log("receipt: ", receipt)

        setLoading(false)
        message.success(`Auction Cancelled!`)
        window.location.reload()
    }

    ///////////////////////
    //  resultAuction()  //
    ///////////////////////

    async function handleResultAuction() {
        setLoading(true)

        const resultOptions = {
            abi: nftAuctionAbi,
            contractAddress: auctionAddress,
            functionName: "resultAuction",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
            },
        }

        console.log("resultOptions: ", resultOptions)

        const tx = await runContractFunction({
            params: resultOptions,
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => console.log(error),
        })

        console.log("tx: ", tx)

        const receipt = await tx.wait(1)

        console.log("receipt: ", receipt)

        setLoading(false)
        message.success(`Auction Resulted!`)
        window.location.reload()
    }

    //////////////////////
    //  Provenance List //
    //////////////////////

    function renderItem(item) {
        return (
            <List.Item>
                <List.Item.Meta
                    avatar={<Avatar src={AVATAR_URL} size="large" />}
                    title={title(item)}
                    description={item.timestamp}
                />
            </List.Item>
        )
    }

    // title function is run by renderItem
    function title(item) {
        const user = truncateStr(item.HighestBidder || item.seller || item.buyer || "", 15)
        const amount =
            item.HighestBid === null || item.reservePrice === null || item.price === null
                ? null
                : item.HighestBid || item.reservePrice || item.price || " "

        console.log("amount1: ", amount)
        console.log("item: ", item)

        return (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "16px" }}>
                    {item.__typename} by <span style={{ fontWeight: "bold" }}>{user}</span>{" "}
                </span>
                <span
                    style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        // display: "inline-block",
                        // marginRight: "50px !important",
                        // width: "100%",
                        // marginLeft: "100px",
                        // paddingRight: "100px",
                    }}
                >
                    {formatUnits(amount)}
                </span>
            </div>
        )
    }

    //////////////////
    //  useEffects  //
    //////////////////

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled]) // run updateUI if isWeb3Enabled

    return (
        <div>
            <TokenModal
                data={data}
                showModal={showModal}
                setShowModal={setShowModal}
                collectionName={collectionName}
                imageURI={imageURI}
            />
            {data && imageURI ? (
                <Layout>
                    <Content style={{ background: "#f7f7f7" }}>
                        <div align="center" style={{ padding: "50px" }}>
                            <Space>
                                <Image src={imageURI} alt="Epi Image" width={400} height={400} />
                            </Space>
                        </div>
                    </Content>
                    <Content style={{ background: "#fff" }}>
                        <div style={{ padding: "50px" }}>
                            <Row gutter={[30, 30]}>
                                <Col span={12}>
                                    <Overview
                                        tokenId={tokenId}
                                        tokenName={tokenName}
                                        collectionName={collectionName}
                                        seller={seller}
                                        nftAddress={nftAddress}
                                        formattedSellerAddress={formattedSellerAddress}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Card className="saleCard">
                                        {price ? (
                                            <FixedPriceDisplay
                                                price={formatUnits(price)}
                                                userIsSeller={userIsSeller}
                                                handleButtonClick={handleButtonClick}
                                            />
                                        ) : (
                                            <AuctionDisplay
                                                endTime={endTime}
                                                userIsSeller={userIsSeller}
                                                highestBid={
                                                    highestBid ? formatUnits(highestBid) : 0
                                                }
                                                userIsHighbidder={userIsHighbidder}
                                                buyer={buyer}
                                                handleButtonClick={handleButtonClick}
                                                reservePrice={formatUnits(reservePrice)}
                                            />
                                        )}
                                    </Card>
                                    <OwnerDetails
                                        formattedSellerAddress={formattedSellerAddress}
                                        seller={seller}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={[30, 30]}>
                                <Description
                                    nftAddress={nftAddress}
                                    attributes={attributes}
                                    renderItem={renderItem}
                                    tokenProvenance={tokenProvenance}
                                    tokenDescription={tokenDescription}
                                />
                            </Row>
                        </div>
                    </Content>
                    <Footer />
                </Layout>
            ) : (
                <div>Loading...</div>
            )}
        </div>
    )
}

const Overview = ({
    tokenName,
    tokenId,
    seller,
    collectionName,
    nftAddress,
    formattedSellerAddress,
}) => {
    console.log(seller)
    console.log(formattedSellerAddress)
    return (
        <>
            <Title level={1}>
                {tokenName} #{tokenId}
            </Title>
            {/* can use gutter in row instead of span in col */}
            <Row>
                <Col span={8}>
                    <Title type="secondary" level={5}>
                        Owner
                    </Title>
                    <Link href="/profile/[profile]" as={`/profile/${seller}`}>
                        <a>
                            <Button shape="round">{formattedSellerAddress}</Button>
                        </a>
                    </Link>
                </Col>
                <Col span={4}>
                    <Title type="secondary" level={5}>
                        Collection
                    </Title>
                    <Link href="/collection/[collectionAddress]" as={`/collection/${nftAddress}`}>
                        <a>
                            <Button shape="round">{collectionName}</Button>
                        </a>
                    </Link>
                </Col>
            </Row>
        </>
    )
}

// rendered differently depending on if it comes from fixedPriceDisplay or auctionDisplay
const SaleCardButton = ({ handleButtonClick, title, disableButton }) => {
    return (
        <Button
            block
            disabled={disableButton}
            type="primary"
            size="large"
            shape="round"
            className={`${styles["sale-card-button"]} ${disableButton ? styles.disabled : ""}`}
            onClick={() => handleButtonClick(title)}
        >
            {title}
        </Button>
    )
}

const OwnerDetails = ({ formattedSellerAddress, seller }) => {
    return (
        <Row style={{ marginTop: "10px" }}>
            <Col span={3.5} style={{ marginLeft: "25px", marginTop: "2px" }}>
                <Title type="secondary" level={5}>
                    Owner
                </Title>
            </Col>
            <Col span={3} style={{ marginLeft: "5px" }}>
                <Link href="/profile/[profile]" as={`/profile/${seller}`}>
                    <a>
                        <Button shape="round">{formattedSellerAddress}</Button>
                    </a>
                </Link>
            </Col>
        </Row>
    )
}

const FixedPriceDisplay = ({ handleButtonClick, userIsSeller, price }) => {
    return (
        <>
            <Title type="secondary" level={4}>
                Fixed Price
            </Title>
            <Title level={3} style={{ margin: 0 }} type="primary">
                Price {price} ETH
            </Title>
            <SaleCardButton
                title={"Buy Now"}
                disableButton={userIsSeller}
                handleButtonClick={handleButtonClick}
            />
        </>
    )
}

const AuctionDisplay = ({
    buyer,
    endTime,
    onFinish,
    highestBid,
    reservePrice,
    userIsSeller,
    userIsHighbidder,
    handleButtonClick,
}) => {
    console.log("userIsSeller: ", userIsSeller)
    console.log("userIsHighbidder: ", userIsHighbidder)

    return (
        <>
            {endTime < Date.now() / 1000 ? ( // display if endTime in past and auction not resulted or canceled
                <div>
                    <Row style={{ height: "100%" }}>
                        <Col span={11}>
                            <Title type="secondary" level={4}>
                                Auction
                            </Title>
                            <Title level={4} style={{ margin: 0 }} type="primary">
                                {highestBid ? `Winning Bid ${highestBid} ETH` : "No Winning Bid"}
                            </Title>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginTop: "10px",
                                }}
                            >
                                <Title type="secondary" level={4} style={{ marginTop: "5px" }}>
                                    {highestBid ? "Winner" : "No Winner"}
                                </Title>
                                {highestBid !== 0 && highestBid && (
                                    <Link href="/profile/[profile]" as={`/profile/${buyer}`}>
                                        <a>
                                            <Button
                                                style={{ marginLeft: "10px", marginTop: 0 }}
                                                shape="round"
                                            >
                                                {truncateStr(buyer ?? "", 15)}
                                            </Button>
                                        </a>
                                    </Link>
                                )}
                            </div>
                        </Col>
                        <Col span={2}>
                            <Divider
                                type="vertical"
                                style={{
                                    marginTop: "0 10px",
                                    height: "100%",
                                    width: "10px",
                                }}
                            />
                        </Col>
                        <Col span={11}>
                            <Title type="secondary" level={4}>
                                Time Remaining
                            </Title>
                            <Countdown
                                format={`DD:HH:mm:ss`} //format={""} format will show value at same time as prefix unless we comment out
                                value={endTime * 1000}
                                onFinish={() => onFinish()}
                            />
                        </Col>
                    </Row>

                    <SaleCardButton
                        title={
                            userIsSeller
                                ? highestBid
                                    ? "Result Auction"
                                    : "Cancel Auction"
                                : "Auction Ended"
                        }
                        buyer={buyer}
                        disableButton={!userIsSeller}
                        handleButtonClick={handleButtonClick}
                    />
                </div>
            ) : (
                <div>
                    <Row style={{ height: "100%" }}>
                        <Col span={11}>
                            <Title type="secondary" level={4}>
                                Auction
                            </Title>
                            <Title level={3} style={{ margin: 0 }} type="primary">
                                {highestBid
                                    ? `Current Bid ${highestBid} ETH`
                                    : `Reserve ${reservePrice} ETH`}
                            </Title>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginTop: "10px",
                                }}
                            >
                                <Title type="secondary" level={4} style={{ marginTop: "5px" }}>
                                    {highestBid ? "Current Bidder" : "No Bids"}
                                </Title>
                                {highestBid !== 0 && highestBid && (
                                    <Link href="/profile/[profile]" as={`/profile/${buyer}`}>
                                        <a>
                                            <Button
                                                style={{ marginLeft: "10px", marginTop: 0 }}
                                                shape="round"
                                            >
                                                {truncateStr(
                                                    userIsHighbidder ? "You" : buyer ?? "",
                                                    15
                                                )}
                                            </Button>
                                        </a>
                                    </Link>
                                )}
                            </div>
                        </Col>

                        <Col span={2}>
                            <Divider
                                type="vertical"
                                style={{
                                    marginTop: "0 10px",
                                    height: "100%",
                                    width: "10px",
                                }}
                            />
                        </Col>
                        <Col span={11}>
                            <Title type="secondary" level={4}>
                                Time Remaining
                            </Title>
                            <Countdown
                                format={`DD:HH:mm:ss`} //format={""} format will show value at same time as prefix unless we comment out
                                value={endTime * 1000}
                                onFinish={() => onFinish()}
                            />
                        </Col>
                    </Row>
                    <SaleCardButton
                        title={userIsSeller ? "Cancel Auction" : "Place Bid"}
                        buyer={buyer}
                        disableButton={userIsHighbidder}
                        handleButtonClick={handleButtonClick}
                    />
                </div>
            )}
        </>
    )
}

const Description = ({
    attributes,
    nftAddress,
    renderItem,
    tokenProvenance,
    tokenDescription,
}) => {
    return (
        <>
            <Col span={12}>
                <div style={{ marginTop: "50px" }}>
                    <Title level={3} style={{ margin: 0 }}>
                        Description
                    </Title>
                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                    <Text style={{ fontSize: "16px" }}> {tokenDescription}</Text>
                    <Title level={3} style={{ marginTop: "50px" }}>
                        Attributes
                    </Title>
                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                    <Row gutter={[16, 16]}>
                        {attributes.map((attribute, index) => (
                            <Col key={index} xs={24} sm={12} md={8}>
                                <Card
                                    title={Object.values(attribute)[0]}
                                    style={{
                                        fontSize: "16px",
                                        font: "black",
                                        textAlign: "center",
                                    }}
                                >
                                    <p>{Object.values(attribute)[1]}</p>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <Title level={3} style={{ marginTop: "50px" }}>
                        Details
                    </Title>
                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                    <Row>
                        <Link href={`https://mumbai.polygonscan.com/address/${nftAddress}`}>
                            {/* <Link href={`https://goerli.etherscan.io/address/${nftAddress}`}> */}
                            <a target="_blank" style={{ display: "flex", alignItems: "center" }}>
                                <Image
                                    src="/etherscan-logo-circle.png"
                                    preview={false}
                                    alt="Logo"
                                    width={30}
                                    height={30}
                                />
                                <Title
                                    style={{
                                        marginTop: "3px",
                                        marginLeft: "10px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                    level={5}
                                >
                                    View on Etherscan
                                </Title>
                            </a>
                        </Link>
                    </Row>
                </div>
            </Col>
            <Col span={12}>
                <div style={{ marginTop: "50px" }}>
                    <Title level={3} style={{ margin: 0 }}>
                        Provenance
                    </Title>
                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                    <List size="large" dataSource={tokenProvenance} renderItem={renderItem} />
                </div>
            </Col>
        </>
    )
}

export async function getServerSideProps({ params, res }) {
    const { tokenId, collectionAddress } = params || {}

    console.log("params: ", params)

    // getServerSideProps & getStaticProps can be passed "context" allowing us to get any params in the route (e.g. the tokenId from the URL)
    const client = new ApolloClient({
        connectToDevTools: true,
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const tokenIdAsNumber = parseInt(tokenId, 10) // convert tokenId to number
    const hexaTokenID = "0x" + tokenIdAsNumber.toString(16) // convert number to hex (1 => 0x1; 11 => 0xb)

    console.log("typeOf: ", typeof tokenIdAsNumber)
    console.log("hexaTokenID: ", hexaTokenID)

    const id = hexaTokenID + collectionAddress
    console.log("hexaID: ", id)

    const tokenHistory = await client.query({
        query: GET_TOKEN_HISTORY,
        variables: { id: id },
    })

    console.log("tokenHistory: ", tokenHistory)

    const { data } = await client.query({
        query: GET_TOKEN_ACTIVE_ITEMS,
        variables: { id: id },
    })

    console.log("data: ", data)

    const alchemy = new Alchemy({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        network: Network.MATIC_MUMBAI,
    })

    const logs = await alchemy.core.getLogs({
        fromBlock: "0x0",
        toBlock: "latest",
        address: collectionAddress,
        topics: ["0xff4078d3a7633c1bd56ae05b46cf944f917a32264ef635cbc026a7efe2e47368"],
    })

    console.log("logs: ", logs)

    // if token is listed for fixed price sale, it will be the only item returned; no historical fixed price sales
    // if token is listed for auction, the most recent will be displayed first; historical auctions also returned
    const tokenActivity = [...data.activeFixedPriceItems, ...data.activeAuctionItems]
    // const mockTokenActivity = mockAuctions

    console.log("tokenActivity: ", tokenActivity)
    // console.log("mockTokenActivity: ", mockTokenActivity)

    const filteredTokenActivity = tokenActivity.filter(
        (activity) => !activity.canceled && !activity.resulted
    )

    console.log("filteredTokenActivity: ", filteredTokenActivity)

    // Filter out null values
    const nonNullObjects = Object.values(tokenHistory.data).filter((obj) => obj !== null)

    // console.log("nonNullObjects: ", nonNullObjects)

    // Sort non-null objects by block number in ascending order
    const sortedObjects = nonNullObjects.sort((obj1, obj2) => {
        const block1 = obj1.block
        const block2 = obj2.block
        return block2.number - block1.number
    })

    const tokenProvenance = sortedObjects
        // use spread operator to get all properties in addition to block
        .map(({ block: { timestamp }, ...rest }) => ({
            ...rest,
            timestamp,
        }))
        .map((obj) =>
            Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined))
        )
        .map((obj) => {
            const options = {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                hour12: true, // display the time in 12-hour format with "am" or "pm" instead of 24-hour format
                minute: "2-digit",
                second: "2-digit",
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // this line should get browser timezone; VPN doesn't change browser timezone tho so can't test
            }
            const { __typename, ...rest } = obj // Destructure the __typename property from the object
            return {
                ...rest,
                timestamp: new Date(obj.timestamp * 1000)
                    .toLocaleString("en-GB", options) // "en-GB" sets the format of the date
                    .split(", ")
                    .join(" @ "), // Split and join the timestamp property with the @ symbol
                __typename: __typename.split(/(?=[A-Z][^A-Z])/).join(" "), // Split and join the __typename property
            }
        })

    return { props: { data: filteredTokenActivity[0], tokenProvenance } }
}

// const mockAuctions = [
// {
//     __typename: "ActiveAuctionItem", // ongoing auction
//     id: "0x70xdb13cbda9cfa26cf5ab62b622a3488e212097c9b",
//     nftAddress: "0xdb13cbda9cfa26cf5ab62b622a3488e212097c9b",
//     tokenId: "7",
//     seller: "0xa6de4e91ce03321be8b947d2936d13b4e6d9b42f",
//     reservePrice: "200000000000000000",
//     startTime: "1682874000",
//     endTime: "1683046800",
//     buyer: "0x0000000000000000000000000000000000000000",
//     highestBid: "300000000000000000",
//     resulted: false,
//     canceled: false,
// },
// {
//     __typename: "ActiveAuctionItem", // finished auction no winner
//     id: "0x70xdb13cbda9cfa26cf5ab62b622a3488e212097c9b",
//     nftAddress: "0xdb13cbda9cfa26cf5ab62b622a3488e212097c9b",
//     tokenId: "7",
//     seller: "0xa6de4e91ce03321be8b947d2936d13b4e6d9b42f",
//     reservePrice: "200000000000000000",
//     startTime: "1682874000",
//     endTime: "1682150000",
//     buyer: "0x0000000000000000000000000000000000000000",
//     highestBid: null,
//     resulted: false,
//     canceled: false,
// },
// {
//     __typename: "ActiveAuctionItem", // finished auction with winner
//     id: "0x70xdb13cbda9cfa26cf5ab62b622a3488e212097c9b",
//     nftAddress: "0xdb13cbda9cfa26cf5ab62b622a3488e212097c9b",
//     tokenId: "7",
//     seller: "0xa6de4e91ce03321be8b947d2936d13b4e6d9b42f",
//     reservePrice: "200000000000000000",
//     startTime: "1682874000",
//     endTime: "1682150000",
//     buyer: "0x865C2d460d0c577DD31Db62abE8C89bB9465E1A9",
//     highestBid: "300000000000000000",
//     resulted: false,
//     canceled: false,
// },
// ]
