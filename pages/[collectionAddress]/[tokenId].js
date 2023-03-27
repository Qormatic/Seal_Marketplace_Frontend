// This is the template for "Individual NFT Page"

import { GET_TOKEN_HISTORY, GET_ACTIVE_ITEMS } from "../../constants/subgraphQueries"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { useNotification } from "web3uikit"
import nftMarketplaceAbi from "../../constants/MP_NFTMarketplace.json"
import nftAuctionAbi from "../../constants/MP_NFTAuction.json"
import nftAbi from "../../constants/BasicNft.json"
import { networkMapping } from "../../constants"
import styles from "../../styles/components.module.css"
import { ethers } from "ethers"
import Link from "next/link"
// import Image from "next/image"
import { useEffect, useState } from "react"
import {
    Layout,
    Row,
    Col,
    Image,
    Typography,
    Card,
    Button,
    Modal,
    Input,
    Spin,
    Avatar,
    Divider,
    Space,
    List,
    Statistic,
} from "antd"
import { truncateStr } from "../../utils/truncate"

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

// __typename: 'ActiveAuctionItem',/                                __typename: 'ActiveFixedPriceItem',
// id: '0x60xe7598ca775da796b47a8988e461681ad4d5c7150',                     id: '0x10x5cfd121c985c9de556b215118ef2db204c1c8b26',
// nftAddress: '0xe7598ca775da796b47a8988e461681ad4d5c7150',        nftAddress: '0x5cfd121c985c9de556b215118ef2db204c1c8b26',
// tokenId: '6',                                                       tokenId: '1',
// seller: '0xb68c38d85f7fd44af18da28d81a2beeacbbba4c3',                seller: '0xd21bb23e1f754f3a282e5aff82ba6f58b7e15d3b',
// reservePrice: '100000000000000000',                                   price: '1000000000'
// startTime: '1677935111',                                                  //  //////////
// endTime: '1679058131',                                                    //  //////////
// buyer: '0x0000000000000000000000000000000000000000',                  buyer: '0x0000000000000000000000000000000000000000',
// highestBid: '1000000000000000000'                                         //  //////////

export default function NFTPage({
    data: {
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
    },
    tokenProvenance: tokenProvenance,
}) {
    const { isWeb3Enabled, account, chainId } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [collectionName, setCollectionName] = useState("")
    const [attributes, setAttributes] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [deadline, setDeadline] = useState(0)
    const [loading, setLoading] = useState(false)
    const [newBid, setNewBid] = useState(0)

    const chainString = chainId ? parseInt(chainId).toString() : null

    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const auctionAddress = chainId ? networkMapping[chainString].NFTAuction[0] : null
    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15)

    const dispatch = useNotification()
    const { Countdown } = Statistic

    /////////////////
    //  Set up UI  //
    /////////////////

    async function updateUI() {
        const tokenURI = await getTokenURI()
        const collectionName = await getName()
        console.log(`The TokenURI is ${tokenURI}`)
        // We cheat a little here on decentralization by using an IPFS Gateway instead of IPFS directly because not all browsers are IPFS compatible
        // Rather than risk our FE showing blank images on some browsers, we update tokenURIs where "IPFS://" is detected to "HTTPS://"
        // The gateway "https://ipfs.io/ipfs/" is provided by the IPFS team
        // The other solution would be to store the image on a server (like Moralis) and call from there
        if (tokenURI) {
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const { image, name, description, attributes } = await (await fetch(requestURL)).json()
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

    // useEffect(() => {
    //     const targetTime = endTime
    //     const now = Math.floor(Date.now() / 1000)
    //     const diff = targetTime - now
    //     setDuration(diff)
    // }, [])

    // const now = new Date()
    // const diff = endTime - now.getTime() / 1000 // get difference in seconds

    // console.log(endTime)

    // const days = Math.floor(diff / 86400) // unix timestamp divided by 86400 gets number of hours
    // const hours = Math.floor(diff / 3600) // unix timestamp divided by 3600 gets number of hours
    // const minutes = Math.floor((diff % 3600) / 60) // get number of minutes

    // console.log(
    //     `There are ${days} days or ${hours} hours or ${minutes} minutes until the Unix timestamp.`
    // )

    /////////////////////////
    //  handleButtonClick  //
    /////////////////////////

    const handleButtonClick = () => {
        setShowModal(true)
    }

    ////////////////////
    //  HandleBuyNow  //
    ////////////////////

    const handleBuyNow = () => {
        setLoading(true)
        buyItem({
            // console.log any error returned
            onError: (error) => console.log(error),
            // trigger "handleBuyItemSuccess" if "buyitem" is successful which, in turn, shows user a notification
            onSuccess: handleBuyItemSuccess,
        })
        setLoading(false)
    }

    // define & run the buyItem function call we need to interact with our marketplace contract
    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    const handleBuyItemSuccess = async (tx) => {
        // use async/await to make sure "updateListing" xaction goes through first before we show user the notification
        await tx.wait(1)
        // notification
        dispatch({
            type: "success",
            message: "Item bought!",
            title: "Item Bought",
            position: "topR",
        })
    }

    //////////////////////
    //  HandlePlaceBid  //
    //////////////////////

    const handlePlaceBid = () => {
        setLoading(true)
        placeBid({
            // console.log any error returned
            onError: (error) => console.log(error),
            // trigger "handlePlaceBidSuccess" if "placeBid" is successful which, in turn, shows user a notification
            onSuccess: handlePlaceBidSuccess,
        })
        setLoading(false)
    }

    // define & run the buyItem function call we need to interact with our marketplace contract
    const { runContractFunction: placeBid } = useWeb3Contract({
        abi: nftAuctionAbi,
        contractAddress: auctionAddress,
        functionName: "placeBid",
        params: {
            placeBid: newBid,
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    const handlePlaceBidSuccess = async (tx) => {
        // use async/await to make sure "updateListing" xaction goes through first before we show user the notification
        await tx.wait(1)
        // notification
        dispatch({
            type: "success",
            message: "Bid Placed!",
            title: "Bid Placed",
            position: "topR",
        })
    }

    ////////////////////
    //  List Entries  //
    ////////////////////

    function renderItem(item) {
        return (
            <List.Item>
                <List.Item.Meta
                    avatar={<Avatar src={"https://example.com/avatar1.jpg"} size="large" />}
                    title={title(item)}
                    description={item.timestamp}
                />
            </List.Item>
        )
    }

    function title(item) {
        const user = truncateStr(item.HighestBidder ?? item.seller ?? "", 15)
        const amount = item.HighestBid ?? item.reservePrice ?? item.price ?? ""

        return (
            <span style={{ fontSize: "16px" }}>
                {item.__typename} by <span style={{ fontWeight: "bold" }}>{user}</span>{" "}
                <span
                    style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        // display: "inline-block",
                        // marginRight: "50px !important",
                        // width: "100%",
                        paddingLeft: "200px",
                        // marginLeft: "100px",
                        // paddingRight: "100px",
                    }}
                >
                    {ethers.utils.formatUnits(amount, "ether")}
                </span>
            </span>
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

    // Check if price is null/undefined; if No use price. If yes then check if reservePrice is null/undefined; if No use reservePrice.
    // If both undefined use 0
    const priceToFormat = price ?? reservePrice ?? 0

    return (
        <div>
            <Modal
                open={showModal}
                onCancel={() => setShowModal(false)}
                title={`Buy "${collectionName} #${tokenId}"`}
                footer={[
                    <Button danger onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>,

                    <Button
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
                        <Input // change to inputNumber
                            addonBefore={"Price"}
                            className={styles.centered}
                            style={{ width: "60%" }}
                            autoFocus
                            placeholder={ethers.utils.formatUnits(price, "ether")}
                            disabled
                            // onChange captures each change as your typing and assigns to setPrice. You can't pass price direct to button without useState
                        />
                    ) : (
                        <Input // change to inputNumber
                            addonBefore={"Min Bid Required"}
                            className={styles.centered}
                            style={{ width: "60%" }}
                            autoFocus
                            placeholder={ethers.utils.formatUnits(
                                reservePrice ? reservePrice : highestBid,
                                "ether"
                            )}
                            onChange={(event) => setNewBid(event.target.value)}

                            // onChange captures each change as your typing and assigns to setPrice. You can't pass price direct to button without useState
                        />
                    )}
                </Spin>
            </Modal>
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
                                <Title level={1}>
                                    {tokenName} #{tokenId}
                                </Title>
                                {/* can use gutter in row instead of span in col */}
                                <Row>
                                    <Col span={6}>
                                        <Title type="secondary" level={5}>
                                            Created By
                                        </Title>
                                        <Button shape="round">
                                            {truncateStr(seller || "", 15)}
                                        </Button>
                                    </Col>
                                    <Col span={6}>
                                        <Title type="secondary" level={5}>
                                            Collection
                                        </Title>
                                        <Button shape="round">{collectionName}</Button>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={12}>
                                {price ? (
                                    <Card style={{ borderRadius: "15px" }}>
                                        <Title type="secondary" level={4}>
                                            Fixed Price
                                        </Title>
                                        <Title level={3} style={{ margin: 0 }} type="primary">
                                            Price{" "}
                                            {ethers.utils.formatUnits(priceToFormat, "ether")} ETH
                                        </Title>
                                        <Button
                                            disabled={isOwnedByUser}
                                            type="primary"
                                            size="large"
                                            shape="round"
                                            block
                                            style={{
                                                paddingRight: "90px",
                                                paddingLeft: "90px",
                                                marginTop: "10px",
                                                backgroundColor: isOwnedByUser
                                                    ? "gray"
                                                    : "rgba(0, 0, 0, 0.8)",
                                                color: "white",
                                                cursor: isOwnedByUser ? "default" : "pointer",
                                                opacity: isOwnedByUser ? 0.5 : 1,
                                            }}
                                            onClick={handleButtonClick}
                                        >
                                            Buy Now
                                        </Button>
                                    </Card>
                                ) : (
                                    <Card style={{ borderRadius: "15px" }}>
                                        <Row style={{ height: "100%" }}>
                                            {buyer !==
                                            "0x0000000000000000000000000000000000000000" ? (
                                                <Col span={11}>
                                                    <Title type="secondary" level={4}>
                                                        Auction
                                                    </Title>
                                                    <Title
                                                        level={3}
                                                        style={{ margin: 0 }}
                                                        type="primary"
                                                    >
                                                        Current Bid{" "}
                                                        {ethers.utils.formatUnits(
                                                            highestBid,
                                                            "ether"
                                                        )}{" "}
                                                        ETH
                                                    </Title>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            marginTop: "10px",
                                                        }}
                                                    >
                                                        <Title
                                                            type="secondary"
                                                            level={5}
                                                            style={{
                                                                marginTop: "5px",
                                                            }}
                                                        >
                                                            Bidder
                                                        </Title>
                                                        <Button
                                                            style={{
                                                                marginLeft: "10px",
                                                                marginTop: 0,
                                                                //     paddingLeft: "10px",
                                                            }}
                                                            shape="round"
                                                        >
                                                            {truncateStr(buyer || "", 15)}
                                                        </Button>
                                                    </div>
                                                </Col>
                                            ) : (
                                                <Col span={11}>
                                                    <Title type="secondary" level={4}>
                                                        Auction
                                                    </Title>
                                                    <Title
                                                        level={3}
                                                        style={{ margin: 0 }}
                                                        type="primary"
                                                    >
                                                        Reserve{" "}
                                                        {ethers.utils.formatUnits(
                                                            priceToFormat,
                                                            "ether"
                                                        )}{" "}
                                                        ETH
                                                    </Title>
                                                </Col>
                                            )}
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
                                                    format={`DD:HH:mm`} //format={""} format will show value at same time as prefix unless we comment out
                                                    value={new Date().setMilliseconds(endTime)}
                                                    onFinish={onFinish}
                                                    // onChange={(value) => {
                                                    //     setDeadline(value)
                                                    // }}
                                                    // prefix={`${Math.round(
                                                    //     deadline / 86400000
                                                    // )} days or ${Math.round(
                                                    //     deadline / 3600000
                                                    // )} hours or ${Math.round(
                                                    //     deadline / 60000
                                                    // )} minutes`}
                                                />
                                            </Col>
                                        </Row>
                                        <Button
                                            disabled={isOwnedByUser}
                                            type="primary"
                                            size="large"
                                            shape="round"
                                            block
                                            style={{
                                                color: "white",
                                                backgroundColor: "rgba(0, 0, 0, 0.8)",
                                                paddingRight: "90px",
                                                paddingLeft: "90px",
                                                marginTop: "10px",
                                                backgroundColor: isOwnedByUser
                                                    ? "gray"
                                                    : "rgba(0, 0, 0, 0.8)",
                                                cursor: isOwnedByUser ? "default" : "pointer",
                                                opacity: isOwnedByUser ? 0.5 : 1,

                                                // width: "100%",
                                            }}
                                            onClick={handleButtonClick}
                                        >
                                            Place Bid
                                        </Button>
                                    </Card>
                                )}
                                <Row style={{ marginTop: "10px" }}>
                                    <Col
                                        span={3.5}
                                        style={{ marginLeft: "25px", marginTop: "2px" }}
                                    >
                                        <Title type="secondary" level={5}>
                                            Owner
                                        </Title>
                                    </Col>
                                    <Col span={3} style={{ marginLeft: "5px" }}>
                                        <Button shape="round">{formattedSellerAddress}</Button>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Row gutter={[30, 30]}>
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
                                                    title={attribute.trait_type}
                                                    style={{
                                                        fontSize: "16px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <p>{attribute.value}</p>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Title level={3} style={{ marginTop: "50px" }}>
                                        Details
                                    </Title>
                                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                                    <Row>
                                        <Link
                                            href={`https://goerli.etherscan.io/address/${nftAddress}`}
                                        >
                                            <a
                                                target="_blank"
                                                style={{ display: "flex", alignItems: "center" }}
                                            >
                                                <Image
                                                    src="/etherscan-logo-circle.png"
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
                                    <List
                                        size="large"
                                        dataSource={tokenProvenance}
                                        renderItem={renderItem}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Content>
                <Footer />
            </Layout>
        </div>
    )
}

export async function getStaticProps({ params }) {
    const { tokenId, collectionAddress, id } = params || {}

    // getServerSideProps & getStaticProps can be passed "context" allowing us to get any params in the route (e.g. the tokenId from the URL)
    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const { data } = await client.query({
        query: GET_ACTIVE_ITEMS,
    })

    const allItems = [...data.activeFixedPriceItems, ...data.activeAuctionItems]
    const filteredItems = allItems.filter(
        (item) => item.tokenId === tokenId && item.nftAddress === collectionAddress
    )

    const tokenHistory = await client.query({
        query: GET_TOKEN_HISTORY,
        variables: { id: filteredItems[0].id },
    })

    console.log("tokenHistory: ", tokenHistory)

    // Filter out null values
    const nonNullObjects = Object.values(tokenHistory.data).filter((obj) => obj !== null)

    console.log("nonNullObjects: ", nonNullObjects)

    // Sort non-null objects by block number in ascending order
    const sortedObjects = nonNullObjects.sort((obj1, obj2) => {
        const block1 = obj1.block
        const block2 = obj2.block
        return block2.number - block1.number
    })

    console.log("sortedObjects: ", sortedObjects)

    const tokenProvenance = sortedObjects
        .map(
            ({
                __typename,
                id,
                nftAddress,
                HighestBid,
                HighestBidder,
                reservePrice,
                price,
                seller,
                tokenId,
                block: { timestamp },
            }) => ({
                __typename,
                id,
                nftAddress,
                HighestBid,
                HighestBidder,
                reservePrice,
                price,
                seller,
                tokenId,
                timestamp,
            })
        )
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
                // second: "2-digit",
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

    console.log("tokenProvenance: ", tokenProvenance)

    // const parts = tokenProvenance[0].timestamp.split(", ")
    // console.log("parts: ", parts[0] + " @ " + parts[1]) -------> "DD/MM/YYYY @ HH:MM:SS"

    return { props: { data: filteredItems[0], tokenProvenance: tokenProvenance } }
}

export async function getStaticPaths() {
    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const { data } = await client.query({
        query: GET_ACTIVE_ITEMS,
    })

    const allItems = [...data.activeFixedPriceItems, ...data.activeAuctionItems]

    const uniqueItems = [...new Set(allItems.map(({ id }) => id))] // {id} is destructured item.id

    const allPaths = uniqueItems.map((id) => {
        const obj = allItems.find((item) => item.id === id)
        return {
            params: {
                collectionAddress: obj.nftAddress,
                tokenId: obj.tokenId,
            },
        }
    })

    return {
        paths: allPaths, // tell app which routes to create in build time
        fallback: false, // if user puts in an incorrect route; 404 will be returned
    }
}
