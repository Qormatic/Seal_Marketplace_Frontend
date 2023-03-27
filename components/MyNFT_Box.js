// Notes:
// Use serverSideProps to generate my-nfts

import { useState, useEffect } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplaceAbi from "../constants/MP_NFTMarketplace.json"
import nftAuctionAbi from "../constants/MP_NFTAuction.json"
import nftAbi from "../constants/BasicNft.json"
import styles from "../styles/components.module.css"
import Image from "next/image"
import { useNotification } from "web3uikit"
import { ethers } from "ethers"
import { truncateStr } from "../utils/truncate"
import {
    Card,
    Tooltip,
    Modal,
    Form,
    Input,
    Select,
    Spin,
    Button,
    DatePicker,
    InputNumber,
} from "antd"
import { FileSearchOutlined, ShoppingCartOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { NotifyNamespace } from "alchemy-sdk"
const { RangePicker } = DatePicker
const { Meta } = Card

// props passed to NFTBox from index.js
export default function NFTBox({
    collectionName,
    nftAddress,
    tokenId,
    marketplaceAddress,
    auctionAddress,
}) {
    const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [modal, setModal] = useState({ visible: false, key: null })
    const [loading, setLoading] = useState(false)
    const [nftToSend, setNftToSend] = useState(null)
    const [price, setPrice] = useState(0)
    const [auction, setAuction] = useState({
        reservePrice: null,
        dateRange: [],
        startTime: null,
        endTime: null,
        minBidReservePrice: null,
    })
    const dispatch = useNotification()
    const { runContractFunction } = useWeb3Contract()
    const [form] = Form.useForm()

    ////////////////////
    //  Modal Config  //
    ////////////////////

    const rangeConfig = {
        rules: [
            {
                type: "array",
                required: true,
                message: "Please select time!",
            },
        ],
    }

    const selectOptions = [
        { label: "True", value: "true" },
        { label: "False", value: "false" },
    ]

    /////////////////
    //  Set up UI  //
    /////////////////

    async function updateUI() {
        const tokenURI = await getTokenURI()
        console.log(`The TokenURI is ${tokenURI}`)
        // We cheat a little here on decentralization by using an IPFS Gateway instead of IPFS directly because not all browsers are IPFS compatible
        // Rather than risk our FE showing blank images on some browsers, we update tokenURIs where "IPFS://" is detected to "HTTPS://"
        // The gateway "https://ipfs.io/ipfs/" is provided by the IPFS team
        // The other solution would be to store the image on a server (like Moralis) and call from there
        if (tokenURI) {
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json()
            const imageURI = tokenURIResponse.image
            const imageURI_URL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            setImageURI(imageURI_URL)
            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURIResponse.description)
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

    ////////////////////
    //  Card Handlers //
    ////////////////////

    async function handleButtonClick(buttonType) {
        // We open Listing modal/ Auction form
        setModal({ visible: true, key: buttonType })
    }

    /////////////////////////////////
    //  List Fixed-Price Handlers  //
    /////////////////////////////////

    async function approveAndList(price) {
        console.log("Approving...")
        setLoading(true)
        // const nftAddress = data.data[0].inputResult
        // const tokenId = data.data[1].inputResult
        // the const "formattedPrice" takes the input price in human readable form, converts it to Ethreum readable form & then changes it to string
        const formattedPrice = ethers.utils.parseUnits(price, "ether").toString()

        // define the "approve" function call we need to interact with our marketplace contract
        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "setApprovalForAll",
            params: {
                operator: marketplaceAddress,
                approved: true,
            },
        }

        await runContractFunction({
            // run the "approve" function call
            params: approveOptions,
            // trigger "handleMarketApproveSuccess" if "approve" is successful which, in turn, triggers the "listItem" function
            onSuccess: () => handleMarketApproveSuccess(nftAddress, tokenId, formattedPrice),
            onCancel: () => setLoading(false),
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => {
                console.log(error), setLoading(false)
            },
        })
    }

    async function handleMarketApproveSuccess(nftAddress, tokenId, formattedPrice) {
        console.log("Ok! Now time to list")
        // define the "listItem" function call we need to interact with our marketplace contract
        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: formattedPrice,
            },
        }

        await runContractFunction({
            // run the "approve" function call
            params: listOptions,
            // trigger "handleListSuccess" if "listItem" is successful which, in turn, shows user a notification
            onSuccess: handleListSuccess,
            // console.log any error returned
            onError: (error) => console.log(error),
        })

        setModal({ visible: false, key: null })
    }

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    async function handleListSuccess(tx) {
        // use async/await to make sure xaction goes through first before we show user the notification i.e. that we get a block confirmation
        await tx.wait(1)
        // send notification
        dispatch({
            type: "success",
            message: "NFT listing",
            title: "NFT listed",
            position: "topR",
        })
    }

    /////////////////////////////
    //  Auction Form Handlers  //
    /////////////////////////////

    const handleInputChange = (changedValues, allValues) => {
        const { reservePrice, dateRange, minBidReservePrice } = allValues

        setAuction({
            reservePrice: reservePrice,
            dateRange: dateRange,
            minBidReservePrice: minBidReservePrice,
        })
        // console.log("changedValues: ", changedValues)
        // console.log("allValues: ", allValues)
    }

    const handleAuctionFormSubmit = (values) => {
        console.log("VALUES: ", values)
        // console.log("AUCTION2: ", auction)

        const startDateString = new Date(values.dateRange[0].$d.setSeconds(0))
        const endDateString = new Date(values.dateRange[1].$d.setSeconds(0))

        const startTime = Math.floor(startDateString.getTime() / 1000)
        const endTime = Math.floor(endDateString.getTime() / 1000)

        setAuction({
            reservePrice: values.reservePrice,
            datedRange: [],
            startTime: startTime,
            endTime: endTime,
            minBidReservePrice: values.minBidReservePrice,
        })

        console.log("handleAuctionFormSubmit complete")

        // console.log("AUCTION3: ", auction) // this log will not accurately show the updated auction values set by setAuction but a useEffect will show correctly
    }

    const handleCancel = () => {
        setModal({ visible: false, key: null })
        form.resetFields()
    }

    ///////////////////////////////
    //  Create Auction Handlers  //
    ///////////////////////////////

    async function approveAndCreateAuction() {
        console.log("Approving...")
        setLoading(true)

        console.log("approveAndCreateAuction: ", auction)

        const formattedResPrice = ethers.utils
            .parseUnits(auction.reservePrice.toString(), "ether")
            .toString()

        console.log("formattedResPrice: ", formattedResPrice)

        // define the "approve" function call we need to interact with our marketplace contract
        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress, // comes from props passed into "MY_NFTBox.js" from "my-nfts.js"
            functionName: "setApprovalForAll",
            params: {
                operator: auctionAddress,
                approved: true,
            },
        }

        await runContractFunction({
            // run the "approve" function call
            params: approveOptions,
            // trigger "handleAuctionApproveSuccess" if "approve" is successful which, in turn, triggers the "listItem" function
            onSuccess: () =>
                handleAuctionApproveSuccess(
                    nftAddress,
                    tokenId,
                    auction.startTime,
                    auction.endTime,
                    auction.minBidReservePrice,
                    formattedResPrice
                ),
            onCancel: () => setLoading(false),
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => {
                console.log(error), setLoading(false)
            },
        })
    }

    async function handleAuctionApproveSuccess(
        nftAddress,
        tokenId,
        startTime,
        endTime,
        minBidReservePrice,
        formattedResPrice
    ) {
        console.log("Ok! Now time to create auction")
        console.log(
            "handleAuctionApproveSuccess: ",
            nftAddress,
            tokenId,
            startTime,
            endTime,
            minBidReservePrice,
            formattedResPrice
        )
        // define the "createAuction" function call we need to interact with our marketplace contract
        const auctionOptions = {
            abi: nftAuctionAbi,
            contractAddress: auctionAddress,
            functionName: "createAuction",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                _reservePrice: formattedResPrice,
                _startTimestamp: startTime,
                minBidReserve: minBidReservePrice,
                _endTimestamp: endTime,
            },
        }

        await runContractFunction({
            // run the "approve" function call
            params: auctionOptions,
            // trigger "handleAuctionSuccess" if "createAuction" is successful which, in turn, shows user a notification
            onSuccess: handleAuctionSuccess,
            // console.log any error returned
            onError: (error) => console.log(error),
        })

        setModal({ visible: false, key: null })
    }

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    async function handleAuctionSuccess(tx) {
        // use async/await to make sure xaction goes through first before we show user the notification i.e. that we get a block confirmation
        await tx.wait(1)
        // send notification
        dispatch({
            type: "success",
            message: "NFT Auction Created",
            title: "Auction Created",
            position: "topR",
        })
    }

    //////////////////
    //  useEffects  //
    //////////////////

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled]) // run updateUI if isWeb3Enabled

    useEffect(() => {
        if (auction.startTime) {
            console.log("USEEFFECT_AUCTION: ", auction) // Log the current value of auction after each render
            approveAndCreateAuction()
        }
    }, [auction])

    useEffect(() => {
        console.log(price) // Log the current value of auction after each render
    }, [price])

    return (
        <div>
            <div>
                {imageURI ? (
                    <Card
                        hoverable
                        actions={[
                            <Tooltip title="Create Timed NFT Auction">
                                <FileSearchOutlined onClick={() => handleButtonClick("Auction")} />
                            </Tooltip>,
                            <Tooltip title="Create Fixed-Price NFT Listing">
                                <ShoppingCartOutlined onClick={() => handleButtonClick("List")} />
                            </Tooltip>,
                        ]}
                        style={{ width: 240, border: "2px solid #e7eaf3" }}
                        cover={
                            <Image
                                loader={() => imageURI}
                                src={imageURI}
                                height="200"
                                width="200"
                            />
                        }
                    >
                        <Meta
                            title={`${tokenName}     #${tokenId}`}
                            description={tokenDescription}
                        />
                        <div>
                            <p>{truncateStr(nftAddress, 15)}</p>
                        </div>
                    </Card>
                ) : (
                    <div>Loading...</div>
                )}

                {modal.visible && modal.key === "List" ? (
                    <div>
                        <Modal
                            title={`List "${collectionName} #${tokenId}" For Sale`}
                            open={modal}
                            onCancel={() => setModal({ visible: false, key: null })}
                            // onOk={() => list(nftToSend, price)}
                            // okText="List"
                            footer={[
                                <Button
                                    danger
                                    onClick={() => setModal({ visible: false, key: null })}
                                >
                                    Cancel
                                </Button>,
                                <Button
                                    onClick={() => approveAndList(price)}
                                    type="primary"
                                    className={styles.button}
                                >
                                    List NFT
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
                                <Input
                                    addonBefore="Listing Price"
                                    className={styles.centered}
                                    style={{ width: "60%" }}
                                    autoFocus
                                    placeholder="Listing Price in WEI"
                                    onChange={(event) => setPrice(event.target.value)}
                                    // onChange captures each change as your typing and assigns to setPrice. You can't pass price direct to button without useState
                                />
                            </Spin>
                        </Modal>
                    </div>
                ) : modal.visible && modal.key === "Auction" ? (
                    <div>
                        <Modal
                            title={`Create "${collectionName} #${tokenId}" Auction`}
                            open={modal}
                            onCancel={() => setModal({ visible: false, key: null })}
                            // onOk={() => list(nftToSend, price)}
                            // okText="List"
                            footer={[
                                <Button danger onClick={handleCancel}>
                                    Cancel
                                </Button>,
                                <Button
                                    key="submit"
                                    type="primary"
                                    form="auctionForm"
                                    htmlType="submit"
                                    className={styles.button}
                                >
                                    Create Auction
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
                                <Form
                                    id="auctionForm"
                                    form={form}
                                    labelCol={{
                                        span: 7,
                                    }}
                                    wrapperCol={{
                                        span: 16,
                                    }}
                                    layout="horizontal"
                                    style={{
                                        maxWidth: 600,
                                    }}
                                    // onValuesChange={handleInputChange} // onValuesChange captures form values; no need to use onChange on each form.item
                                    onFinish={handleAuctionFormSubmit} // onFinish accurately captures final form values
                                >
                                    <Form.Item
                                        name="reservePrice"
                                        initialValue={0.0001}
                                        label={
                                            <span>
                                                Reserve Price&nbsp;
                                                <Tooltip
                                                    title="Select the Minimum amount to be accepted as the winning bid"
                                                    placement="right"
                                                >
                                                    <InfoCircleOutlined />
                                                </Tooltip>
                                            </span>
                                        }
                                    >
                                        <InputNumber
                                            name="reservePrice"
                                            style={{ width: "30%" }}
                                            min="0.0001"
                                            step="0.0001"
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="minBidReservePrice"
                                        rules={[
                                            {
                                                required: true,
                                                message: "Please select true or false!",
                                            },
                                        ]}
                                        label={
                                            <span>
                                                Set Min Bid&nbsp;
                                                <Tooltip
                                                    title="Set auction's Minimum Bid to equal the Reserve Price"
                                                    placement="right"
                                                >
                                                    <InfoCircleOutlined />
                                                </Tooltip>
                                            </span>
                                        }
                                    >
                                        <Select
                                            name="minBidReservePrice"
                                            options={selectOptions}
                                            style={{ width: "30%" }}
                                            placeholder="Select"
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="dateRange"
                                        label="Auction Length"
                                        {...rangeConfig}
                                    >
                                        <RangePicker
                                            name="dateRange"
                                            showTime
                                            format="DD-MM-YYYY HH:mm"
                                        />
                                    </Form.Item>
                                </Form>
                            </Spin>
                        </Modal>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
