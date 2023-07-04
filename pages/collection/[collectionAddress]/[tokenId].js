import { GET_TOKEN_HISTORY, TOKEN_ON_SALE_RECORD } from "@/constants/subgraphQueries"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
// import client from "../_app"
import { useWeb3Contract, useMoralis } from "react-moralis"
import styles from "@/styles/components.module.css"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { NftFilters, Alchemy, Network, Utils } from "alchemy-sdk"
import { ethers } from "ethers"
import { FixedPriceDisplay, OfferDisplay, AuctionDisplay } from "@/components/SaleCards"
import TokenModal from "@/components/TokenModal"
import { networkMapping } from "@/constants"
import nftAuctionAbi from "@/constants/Seal_NFTAuction.json"
import contractAbi from "@/constants/Seal_721_Contract.json"
import contractFactoryAbi from "@/constants/Seal_ContractFactory.json"
import { avatars } from "@/constants/fluff"
import nftAbi from "@/constants/BasicNft.json"
import { formatKey } from "@/utils/formatKey"
import { truncateStr, formatUnits } from "@/utils/truncate"
import { getTokenProvenance } from "@/utils/formatEvents"
import {
    Layout,
    Row,
    Col,
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

const AVATAR_URL = avatars[Math.floor(Math.random() * avatars.length)]

const mumbaiChain = "80001"
const contractFactoryAddress = mumbaiChain ? networkMapping[mumbaiChain].ContractFactory[0] : null

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

export default function NFTPage({ data, tokenProvenance, tokenData }) {
    // const [imageUri, setImageUri] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [src, setSrc] = useState("/images/placeholder.png")
    const [loading, setLoading] = useState(false)
    const {
        __typename,
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
        buyer, // highestBidder while auction open, winningBidder if auction closed, 0x0 if no bids
        seller,
        minter,
    } = data

    const { isWeb3Enabled, account } = useMoralis()

    console.log("account_Description: ", account)
    console.log("tokenData_Description: ", tokenData)
    console.log("tokenProvenance_Description: ", tokenProvenance)

    const userIsHighbidder = buyer === account
    const owner = seller ?? minter
    const isOwner = owner === account || owner === undefined
    const formattedSellerAddress = isOwner ? "You" : truncateStr(owner || "", 15)

    const { runContractFunction } = useWeb3Contract()

    const { chainId } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const auctionAddress = chainId ? networkMapping[chainString].NFTAuction[0] : null

    /////////////////
    //  Set up UI  //
    /////////////////

    async function checkImage() {
        const {
            image: imageUri,
            sealContract: { sealContract, privateView },
        } = tokenData

        // If sealContract and private are both true and the account is the owner, decrypt the image
        if (sealContract === true && privateView === true && isOwner === true) {
            fetch("/api/decrypt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageUri: imageUri }),
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

            // const decryptedImage = await getDecryptedImage(imageUri)
            // setSrc(decryptedImage)
        } else {
            // If sealContract and private are not both true, or the account is not the owner, set the imageUri as is
            setSrc(imageUri)
        }
    }

    /////////////////////////
    //  handleButtonClick  //
    /////////////////////////

    const handleButtonClick = (title) => {
        console.log("title: ", title)

        if (title === "Buy Now") {
            setShowModal((showModal) => !showModal) // Open tokenModal (fixed price view)
        } else if (title === "Make Offer") {
            setShowModal((showModal) => !showModal) // Open tokenModal (make offer view)
        } else if (title === "Place Bid") {
            setShowModal((showModal) => !showModal) // Open tokenModal (auction view)
        } else if (title === "Cancel Auction") {
            handleCancelAuction() // Run cancelAuction() function
        } else if (title === "Result Auction") {
            handleResultAuction() // Run resultAuction() function
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

    //////////////////////////
    //  Handle Image Error  //
    //////////////////////////

    const handleError = () => {
        setSrc("/images/placeholder.png")
    }

    //////////////////
    //  useEffects  //
    //////////////////

    useEffect(() => {
        if (isWeb3Enabled) {
            checkImage()
        }
    }, [isWeb3Enabled])

    return (
        <div>
            <TokenModal
                data={data}
                showModal={showModal}
                setShowModal={setShowModal}
                collectionName={tokenData.collectionName}
                imageUri={src}
            />
            {data && src ? (
                <Layout>
                    <Content style={{ background: "#f7f7f7" }}>
                        <div align="center" style={{ padding: "50px" }}>
                            <Space>
                                <Image src={src} onError={handleError} width={400} height={400} />
                            </Space>
                        </div>
                    </Content>
                    <Content style={{ background: "#fff" }}>
                        <div style={{ padding: "50px" }}>
                            <Row gutter={[30, 30]}>
                                <Col span={12}>
                                    <Overview
                                        tokenId={tokenId}
                                        tokenName={tokenData.name}
                                        collectionName={tokenData.collectionName}
                                        seller={owner}
                                        nftAddress={nftAddress}
                                        formattedSellerAddress={formattedSellerAddress}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Card className="saleCard">
                                        {price ? (
                                            <FixedPriceDisplay
                                                price={formatUnits(price)}
                                                isOwner={isOwner}
                                                handleButtonClick={handleButtonClick}
                                            />
                                        ) : reservePrice ? (
                                            <AuctionDisplay
                                                endTime={endTime}
                                                buyer={buyer}
                                                highestBid={
                                                    highestBid ? formatUnits(highestBid) : 0
                                                }
                                                reservePrice={formatUnits(reservePrice)}
                                                isOwner={isOwner}
                                                userIsHighbidder={userIsHighbidder}
                                                handleButtonClick={handleButtonClick}
                                            />
                                        ) : (
                                            <OfferDisplay
                                                isOwner={isOwner}
                                                handleButtonClick={handleButtonClick}
                                            />
                                        )}
                                    </Card>{" "}
                                    <OwnerDetails
                                        formattedSellerAddress={formattedSellerAddress}
                                        seller={owner}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={[30, 30]}>
                                <Description
                                    tokenData={tokenData}
                                    tokenProvenance={tokenProvenance}
                                    account={account}
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

const Description = ({ tokenData, tokenProvenance, account }) => {
    //////////////////////
    //  Provenance List //
    //////////////////////

    console.log("account_Description: ", account)
    console.log("tokenData_Description: ", tokenData)
    console.log("tokenProvenance_Description: ", tokenProvenance)

    function renderItem(item) {
        return (
            <List.Item>
                <List.Item.Meta
                    avatar={<Avatar src={AVATAR_URL} size="large" />}
                    title={createTitle(item)}
                    description={item.timestamp}
                />
            </List.Item>
        )
    }

    // title function is run by renderItem
    function createTitle(item) {
        console.log("item: ", item)
        const itemUser =
            item.HighestBidder || item.owner || item.buyer || item.minter || item.seller
        const isCurrentUser = account === itemUser
        const displayUser = isCurrentUser ? "You" : truncateStr(itemUser, 15)

        let amount = null

        if (item.__typename !== "Token Minted") {
            if (item.HighestBid !== null) {
                amount = item.HighestBid
            } else if (item.reservePrice !== null) {
                amount = item.reservePrice
            } else if (item.price !== null) {
                amount = item.price
            }
        }

        return (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "16px" }}>
                    {item.__typename} by <span style={{ fontWeight: "bold" }}>{displayUser}</span>{" "}
                </span>
                <span
                    style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                    }}
                >
                    {formatUnits(amount)}
                </span>
            </div>
        )
    }

    // tokenData:  {
    //     name: '001',
    //     filename: '1.png',
    //     Date_Created: '2023-01-01',
    //     Photographer: 'John Doe',
    //     Location: 'New York',
    //     Camera: 'Nikon D850',
    //     Event: 'The Renaissance Revisited',
    //     collectionName: 'NEW COLLECTION!!!',
    //     sealContract: { sealContract: true, privateView: true }
    //   }

    // Remove unwanted keys; flatten sealContract
    let preparedData = { ...tokenData }
    preparedData = { ...preparedData, ...preparedData.sealContract }

    delete preparedData.tokenUri
    delete preparedData.image
    delete preparedData.attributes
    if ("description" in preparedData) {
        delete preparedData.description
    }
    if ("Description" in preparedData) {
        delete preparedData.Description
    }

    return (
        <>
            <Col span={12}>
                <div style={{ marginTop: "50px" }}>
                    <Title level={3} style={{ margin: 0 }}>
                        Description
                    </Title>
                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                    <Text style={{ fontSize: "16px" }}>
                        {" "}
                        {tokenData.Description ? tokenData.Description : tokenData.description}
                    </Text>
                    <Title level={3} style={{ marginTop: "50px" }}>
                        Metadata
                    </Title>
                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                    <Card
                        // title="Token Data"
                        bordered={false}
                        style={{
                            fontSize: "16px",
                            font: "black",
                            textAlign: "center",
                            overflow: "auto",
                            whiteSpace: "nowrap",
                            border: "",
                        }}
                    >
                        <table>
                            <tbody>
                                {Object.entries(preparedData).map(([key, value], index) => (
                                    <tr key={index}>
                                        <td style={{ textAlign: "right", paddingRight: "5px" }}>
                                            {formatKey(key)}
                                        </td>
                                        <td>:</td>
                                        <td style={{ paddingLeft: "5px" }}>{value.toString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                    <Title level={3} style={{ marginTop: "50px" }}>
                        Details
                    </Title>
                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                    <Row>
                        <Link href={tokenData.tokenUri}>
                            <a target="_blank" style={{ display: "flex", alignItems: "center" }}>
                                <Image
                                    src="/Ipfs-logo-1024-ice-text.png"
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
                                    View token on IPFS Database
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

export async function getServerSideProps({ params, res }) {
    const { tokenId, collectionAddress } = params || {}

    // getServerSideProps & getStaticProps can be passed "context" allowing us to get any params in the route (e.g. the tokenId from the URL)
    const client = new ApolloClient({
        connectToDevTools: true,
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    let tokenEvents = {}

    console.log("tokenEvents_586: ", tokenEvents)
    console.log("variables: ", collectionAddress, tokenId)

    try {
        console.log("HELLO 589")

        // this returns all events for this token as object of objects
        const result = await client.query({
            query: GET_TOKEN_HISTORY,
            variables: { nftAddress: collectionAddress, tokenId: tokenId },
            fetchPolicy: "network-only",
        })

        console.log("HELLO 598")
        console.log("result: ", result)

        tokenEvents = result.data // {event1: [], event2: []}
    } catch (error) {
        console.error("Apollo Error_GET_TOKEN_HISTORY:", error)
        console.log("Error details_GET_TOKEN_HISTORY:", error.networkError, error.graphQLErrors)
    }

    // token has no events/history on Seal we redirect to 500 page
    const noEvents = Object.values(tokenEvents).every((item) => item === null)
    console.log("noEvents: ", noEvents)

    ///////////////////////
    //  Redirect to 500  //
    ///////////////////////

    if (noEvents) {
        return {
            redirect: {
                destination: "/500",
                permanent: false,
            },
        }
    }

    const id = tokenId + collectionAddress

    let data

    try {
        // Return single active
        const result = await client.query({
            query: TOKEN_ON_SALE_RECORD,
            variables: { id: id },
            fetchPolicy: "network-only",
        })

        data = result.data
        console.log("data: ", data)
    } catch (error) {
        console.error("Apollo Error_TOKEN_ON_SALE_RECORD:", error)
        console.log("Error details_TOKEN_ON_SALE_RECORD:", error.networkError, error.graphQLErrors)
    }

    console.log("data: ", data)

    /* 
       We display page if item has a tokenMinted event or it is on sale
    */
    const tokenSaleRecord = [...data.activeFixedPriceItems, ...data.activeAuctionItems]

    // if item is not for sale already "tokenSaleRecord.length === 0" but has a tokenMinted item; we use tokenMinted for the saleCard
    if (tokenSaleRecord.length === 0 && tokenEvents.tokenMinteds !== null) {
        tokenSaleRecord.push(tokenEvents.tokenMinteds[0])
    }

    console.log("tokenSaleRecord: ", tokenSaleRecord)

    // Format Token Events for listing in Front End
    const tokenProvenance = getTokenProvenance(tokenEvents)

    //////////////////////////
    //  Set up Alchemy SDK  //
    //////////////////////////

    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL)

    const fetchTokenData = async () => {
        const contract = new ethers.Contract(collectionAddress, nftAbi, provider)

        let tokenData

        try {
            const collectionName = await contract.name()
            const tokenUri = await contract.tokenURI(tokenId)

            if (tokenUri) {
                const requestURL = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/")
                tokenData = await (await fetch(requestURL)).json()
                tokenData.image = tokenData.image.replace("ipfs://", "https://ipfs.io/ipfs/")

                tokenData.collectionName = collectionName
                tokenData.tokenUri = tokenUri
            }
        } catch (error) {
            console.log("error: ", error)
        }

        return tokenData
    }

    let tokenData = await fetchTokenData()

    ////////////////////////////////////////////
    // Check if contract is Seal & is private //
    ////////////////////////////////////////////

    // if Seal we need name & encrypted
    // if other we need name
    async function checkSealContract(collectionAddress) {
        const contractFactory = new ethers.Contract(
            contractFactoryAddress,
            contractFactoryAbi,
            provider
        )

        try {
            // Check for contractAddress in factory contract
            const deployerAddress = await contractFactory.s_deployedContracts(collectionAddress)

            // if deployerAddress returns zero address it's not Seal
            if (deployerAddress === "0x0000000000000000000000000000000000000000") {
                return { sealContract: false, privateView: false }
            } else {
                // Check if private
                const collectionContract = new ethers.Contract(
                    collectionAddress,
                    contractAbi,
                    provider
                )

                // are contract images encrypted true/false
                const privateView = await collectionContract.s_private()

                return { sealContract: true, privateView: privateView }
            }
        } catch (error) {
            console.log("error: ", error)
        }
    }

    tokenData.sealContract = await checkSealContract(collectionAddress)

    console.log("tokenSaleRecord: ", tokenSaleRecord)
    console.log("tokenProvenance: ", tokenProvenance)
    console.log("tokenData: ", tokenData)

    return {
        props: {
            data: tokenSaleRecord[0],
            tokenProvenance,
            tokenData,
        },
    }
}

// const mockFixed = {
//     __typename: "activeFixedPriceItems",
//     id: "0x30x001737dd2f65795b30f9476b9e087ad4fbe8b376",
//     buyer: "0x0000000000000000000000000000000000000000",
//     seller: "0xb68c38d85F7fd44aF18da28d81a2BEEAcbbba4C3",
//     nftAddress: "0x001737dd2f65795b30f9476b9e087ad4fbe8b376",
//     price: "100200000000000000",
//     tokenId: "3",
//     resulted: false,
//     canceled: false,
//     block: {
//         __typename: "Block",
//         id: "0x23a2360",
//         number: "37364560",
//         timestamp: "1687965650",
//     },
// }

// const mockAuctions = {
//     __typename: "activeAuctionItem",
//     id: "0x00x8344a3cd512e4e539679de40428da942a78dea86",
//     nftAddress: "0x8344a3cd512e4e539679de40428da942a78dea86",
//     tokenId: "0",
//     seller: "0xb68c38d85F7fd44aF18da28d81a2BEEAcbbba4C3",
//     reservePrice: "200000000000000000",
//     startTime: "1687284334",
//     endTime: "1689008400",
//     buyer: "0x0000000000000000000000000000000000000000",
//     highestBid: "300000000000000000",
//     resulted: false,
//     canceled: false,
//     block: {
//         __typename: "Block",
//         id: "0x23a2360",
//         number: "37364570",
//         timestamp: "1687965660",
//     },
// }

// const mockEvent = {
//     tokenMinted: {
//         __typename: "TokenMinted",
//         id: "10x26622f083b1a1e8f6f0de4d603bd061038468bf7",
//         minter: "0xb68c38d85f7fd44af18da28d81a2beeacbbba4c3",
//         nftAddress: "0x26622f083b1a1e8f6f0de4d603bd061038468bf7",
//         tokenId: "1",
//         block: {
//             id: "0x23a9b37",
//             number: "37395255",
//             timestamp: "1688057760",
//         },
//     },
// }
