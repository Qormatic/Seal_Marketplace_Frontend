import {
    GET_TOKEN_HISTORY,
    GET_ACTIVE_ITEMS,
    TOKEN_ON_SALE_RECORD,
} from "@/constants/subgraphQueries"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
// import client from "../_app"
import { useWeb3Contract, useMoralis } from "react-moralis"
import styles from "@/styles/components.module.css"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { NftFilters, Alchemy, Network, Utils } from "alchemy-sdk"
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

import { ethers } from "ethers"
import { FixedPriceDisplay, OfferDisplay, AuctionDisplay } from "@/components/SaleCards"
import TokenModal from "@/components/TokenModal"
import { networkMapping } from "@/constants"
import nftAuctionAbi from "@/constants/Seal_NFTAuction.json"
import contractAbi from "@/constants/Seal_721_Contract.json"
import contractFactoryAbi from "@/constants/Seal_ContractFactory.json"
import { avatars } from "@/constants/fluff"
import nftAbi from "@/constants/BasicNft.json"
import { truncateStr, formatUnits } from "@/utils/truncate"
import { getTokenProvenance } from "@/utils/formatEvents"
import { getDecryptedImage } from "@/utils/decryptImage"

const AVATAR_URL = avatars[Math.floor(Math.random() * avatars.length)]

const mumbaiChain = "80001"

const contractFactoryAddress = mumbaiChain ? networkMapping[mumbaiChain].ContractFactory[0] : null

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography
const { Countdown } = Statistic

export default function NFTPage({ data, tokenProvenance, tokenData }) {
    // const [imageUri, setImageUri] = useState("")
    const [attributes, setAttributes] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [src, setSrc] = useState(tokenData.image)
    const [loading, setLoading] = useState(false)
    const [auctionFinished, setAuctionFinished] = useState(false)
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

    const { name, collectionName, description } = tokenData
    const { isWeb3Enabled, account } = useMoralis()

    const userIsHighbidder = buyer === account
    const owner = seller ?? minter
    const userIsSeller = owner === account || owner === undefined
    const formattedSellerAddress = userIsSeller ? "You" : truncateStr(owner || "", 15)

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
        if (sealContract && privateView && userIsSeller) {
            const decryptedImage = await getDecryptedImage(imageUri)
            setSrc(decryptedImage)
        }
        // If sealContract and private are not both true, or the account is not the owner, set the imageUri as is
        else {
            setSrc(imageUri)
        }
    }

    // tokenData:  {
    //     name: 'Picture 3',
    //     filename: '3.png',
    //     Date_Created: '2023-01-03',
    //     Photographer: 'John Doe',
    //     Location: 'Los Angeles',
    //     Camera: 'Canon EOS 5D Mark IV',
    //     Event: 'Hollywood Movie Premiere',
    //     image: 'https://ipfs.io/ipfs/QmXde2Sf7tauR9RBGRWrjMLc2ZjMvQLgWPszB53tvbLs1D/3.png',
    //     collectionName: 'ENCRYPTED 2',
    //     sealContract: { sealContract: true, private: true },
    // description: "blah blah balh"
    //   }

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
                collectionName={collectionName}
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
                                        tokenName={name}
                                        collectionName={collectionName}
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
                                                userIsSeller={userIsSeller}
                                                handleButtonClick={handleButtonClick}
                                            />
                                        ) : reservePrice ? (
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
                                        ) : (
                                            <OfferDisplay
                                                userIsSeller={userIsSeller}
                                                handleButtonClick={handleButtonClick}
                                            />
                                        )}
                                    </Card>
                                    <OwnerDetails
                                        formattedSellerAddress={formattedSellerAddress}
                                        seller={owner}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={[30, 30]}>
                                <Description
                                    nftAddress={nftAddress}
                                    account={account}
                                    attributes={attributes}
                                    tokenProvenance={tokenProvenance}
                                    tokenDescription={description}
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

const Description = ({ attributes, tokenProvenance, tokenDescription, account, nftAddress }) => {
    //////////////////////
    //  Provenance List //
    //////////////////////

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
        const itemUser = item.HighestBidder || item.owner || item.buyer || item.minter
        const isCurrentUser = account === itemUser
        const displayUser = isCurrentUser ? "You" : truncateStr(itemUser, 15)

        const amount =
            item.HighestBid === null ||
            item.reservePrice === null ||
            item.price === null ||
            item.__typename === "Token Minted"
                ? null
                : item.HighestBid || item.reservePrice || item.price || "00000"

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
                        {attributes
                            ? attributes.map((attribute, index) => (
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
                              ))
                            : null}
                    </Row>
                    <Title level={3} style={{ marginTop: "50px" }}>
                        Details
                    </Title>
                    <Divider type="horizontal" style={{ marginTop: "5px" }} />
                    <Row>
                        <Link href={`https://ipfs.io/ipfs/${nftAddress}`}>
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

export async function getServerSideProps({ params, res }) {
    const { tokenId, collectionAddress } = params || {}

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
    //     id: "0x30x001737dd2f65795b30f9476b9e087ad4fbe8b376",
    //     nftAddress: "0x001737dd2f65795b30f9476b9e087ad4fbe8b376",
    //     tokenId: "3",
    //     seller: "0xb68c38d85F7fd44aF18da28d81a2BEEAcbbba4C3",
    //     reservePrice: "200000000000000000",
    //     startTime: "1687284334",
    //     endTime: "1687484334",
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

    // getServerSideProps & getStaticProps can be passed "context" allowing us to get any params in the route (e.g. the tokenId from the URL)
    const client = new ApolloClient({
        connectToDevTools: true,
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const id = tokenId + collectionAddress

    // this returns all events for this token as object of objects
    const tokenEvents = await client.query({
        query: GET_TOKEN_HISTORY,
        variables: { id: id },
    })

    // token has no events/history on Seal we redirect to 500 page
    const noEvents = Object.values(tokenEvents.data).every((item) => item === null)

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

    // Return single active
    // const { data } = await client.query({
    //     query: TOKEN_ON_SALE_RECORD,
    //     variables: { id: id },
    // })

    // console.log("data_847: ", data)

    /* 
       We display page if item has a tokenMinted event or it is on sale
    */
    // const tokenSaleRecord = [...data.activeFixedPriceItems, ...data.activeAuctionItems]

    // const tokenSaleRecord = [mockAuctions, mockFixed]

    const tokenSaleRecord = []

    // if item is not for sale already "tokenSaleRecord.length === 0" but has a tokenMinted item; we use tokenMinted for the saleCard
    if (tokenSaleRecord.length === 0 && tokenEvents.data.tokenMinted !== null) {
        tokenSaleRecord.push(tokenEvents.data.tokenMinted)
    }

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

// async function updateUI() {
//     // get the tokenUri
//     const tokenUri = await getTokenUri()
//     const collectionName = await getName()

//     if (tokenUri) {
//         // if tokenUri contains "ipfs://" replace it; this is because not all browsers are "ipfs://" compatible
//         // if tokenUri does not contain "ipfs://" do nothing
//         const requestURL = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/")
//         console.log("requestURL: ", requestURL)
//         const tokenData = await (await fetch(requestURL)).json()
//         tokenData.image = tokenData.image.replace("ipfs://", "https://ipfs.io/ipfs/")
//         setImageUri(tokenData.image.replace("ipfs://", "https://ipfs.io/ipfs/"))
//         setTokenData(tokenData)
//         setTokenName(tokenData.name)
//         setTokenDescription(tokenData.description)
//         setCollectionName(collectionName)
//         setAttributes(attributes)
//     }
// }

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

// SUB GRAPH UPDATES //
// update how event ids are created
