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
import contractFactoryAbi from "@/constants/Seal_ContractFactory.json"
import contractAbi from "@/constants/Seal_721_Contract.json"
import { Fragment } from "react"
import nftAbi from "@/constants/BasicNft.json"
import { truncateStr } from "@/utils/truncate"
import Link from "next/link"
import { networkMapping } from "@/constants"
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
const mumbaiChain = "80001"
const contractFactoryAddress = mumbaiChain ? networkMapping[mumbaiChain].ContractFactory[0] : null

export default function CollectionPage({ NFTListData, collectionData, profileData }) {
    const [imageURI, setImageURI] = useState("")
    const [showOnSale, setShowOnSale] = useState(true)
    const [showAll, setShowAll] = useState(true)
    const [showAuction, setShowAuction] = useState(false)
    const [showFixedPrice, setShowFixedPrice] = useState(false)
    const [isOwner, setIsOwner] = useState(null)
    const [src, setSrc] = useState(imageURI)

    const { isWeb3Enabled, chainId, account } = useMoralis()
    const { runContractFunction } = useWeb3Contract()

    const allOnSaleNfts = [...NFTListData.activeFixedPriceItems, ...NFTListData.activeAuctionItems]

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
        console.log("account: ", account)
        console.log("collectionData.contractDeployer: ", collectionData.contractDeployer)

        if (account === collectionData.contractDeployer.toLowerCase()) {
            setIsOwner(true)
        } else {
            setIsOwner(false)
        }
    }
    console.log("collectionData: ", collectionData)
    console.log("isOwner: ", isOwner)

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

    //////////////////////////
    //  Handle Image Error  //
    //////////////////////////

    const handleError = () => {
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
        handleSetOwner()
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

    ////////////////////////////////////////////////////
    // Check if contract is Seal & has remaining tokens //
    ////////////////////////////////////////////////////

    async function checkSealContract(collectionAddress) {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL)
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
                return { contractDeployer: false }
            } else {
                // Get remaining Supply
                const collectionContract = new ethers.Contract(
                    collectionAddress,
                    contractAbi,
                    provider
                )

                const maxSupply = await collectionContract.s_maxSupply() // total amount allowed to be minted
                const totalSupply = await collectionContract.totalSupply() // current amount that has been minted

                const difference = maxSupply.sub(totalSupply)
                let bigNum = ethers.BigNumber.from(difference)
                let remainingSupply = bigNum.toString()

                return { contractDeployer: deployerAddress, remainingSupply: remainingSupply }
            }
        } catch (error) {
            console.log("error: ", error)
        }
    }

    const sealCheck = await checkSealContract(collectionAddress)
    console.log("sealCheck: ", collectionAddress, sealCheck)

    let collectionData
    let collection

    // if sealCheck.deployerAddress is not false
    if (sealCheck.deployerAddress !== false) {
        ///////////////////////////////////
        //  Get Seal Collection Details  //
        ///////////////////////////////////

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

            console.log(data)
        } catch (error) {
            console.error(error)
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

            console.log(data)
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

    console.log("collectionData: ", collectionData)

    /////////////////////////
    //  Get On-Sale Items  //
    /////////////////////////

    const currentTime = Math.floor(Date.now() / 1000)

    // let data = { activeFixedPriceItems: [], activeAuctionItems: [] }

    let data = { activeFixedPriceItems: [], activeAuctionItems: [] }

    try {
        const { data } = await client.query({
            query: GET_ACTIVE_COLLECTION_ITEMS,
            variables: {
                collectionAddress: collectionAddress,
                currentTime: currentTime,
            },
        })

        console.log(data)
    } catch (error) {
        console.error(error)
    }

    // create new var bcos "data" is not editable
    let newData = { ...data }

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

    if (collectionData.sealContract !== false) {
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

    const randomDescription =
        collectionDescriptions[Math.floor(Math.random() * collectionDescriptions.length)]
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]

    let profileData = [randomDescription, randomAvatar]

    return {
        props: { NFTListData: newData, collectionData, profileData },
    }
}
