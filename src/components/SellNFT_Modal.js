// Notes:
// Use serverSideProps to generate my-nfts

import { useState, useEffect } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplaceAbi from "@/constants/Seal_NFTMarketplace.json"
import nftAuctionAbi from "@/constants/Seal_NFTAuction.json"
import nftAbi from "@/constants/BasicNft.json"
import { networkMapping } from "@/constants"
import { ethers } from "ethers"
import {
    Card,
    Tooltip,
    Modal,
    Radio,
    Form,
    Input,
    Select,
    Spin,
    Button,
    message,
    DatePicker,
    InputNumber,
} from "antd"
import {
    FileSearchOutlined,
    ShoppingCartOutlined,
    InfoCircleOutlined,
    ClockCircleOutlined,
    ClockCircleTwoTone,
    DollarTwoTone,
    RocketTwoTone,
} from "@ant-design/icons"
const { RangePicker } = DatePicker

const mumbaiChain = "80001"
const marketplaceAddress = mumbaiChain ? networkMapping[mumbaiChain].NFTMarketplace[0] : null
const auctionAddress = mumbaiChain ? networkMapping[mumbaiChain].NFTAuction[0] : null

// props passed to NFTBox from Header.js
export default function SellModal({ showSellModal, handleCancelSellModal }) {
    const { isWeb3Enabled, account } = useMoralis()
    const [sellForm, setSellForm] = useState(null)
    const [loading, setLoading] = useState(false)
    const [tokenDetails, setTokenDetails] = useState({
        tokenId: "",
        collectionAddress: "",
    })
    const [saleTypeDisabled, setSaleTypeDisabled] = useState(true)

    const [auction, setAuction] = useState({
        reservePrice: null,
        dateRange: [],
        startTime: null,
        endTime: null,
        minBidReservePrice: null,
    })

    const { runContractFunction } = useWeb3Contract()
    const [form] = Form.useForm()

    ////////////////////////////
    //  Token Details Handler //
    ////////////////////////////

    const handleTokenDetailsChange = (allValues) => {
        setTokenDetails(allValues)
    }

    ////////////////////
    //  Card Handlers //
    ////////////////////

    async function handleOpenForm(type) {
        // We open Listing modal/ Auction form
        console.log("FORM: ", type)
        setSellForm(type)
        console.log("FORM_STATE: ", sellForm)
        console.log("tokenDetails: ", tokenDetails)
    }

    /////////////////////////////////
    //  List Fixed-Price Handlers  //
    /////////////////////////////////

    const handleListFormSubmit = (values) => {
        console.log("VALUES: ", values)

        approveAndList(
            tokenDetails.tokenId,
            tokenDetails.collectionAddress,
            values.listPrice.toString()
        )

        console.log("handleListFormSubmit complete")
    }

    async function approveAndList(tokenId, collectionAddress, price) {
        console.log("Approving...")
        setLoading(true)

        console.log("price_102: ", price)

        // the const "formattedPrice" takes the input price in human readable form, converts it to Ethereum readable form & then changes it to string
        const formattedPrice = ethers.utils.parseUnits(price, "ether").toString()

        console.log("formattedPrice_108: ", formattedPrice)

        // define the "approve" function call we need to interact with our marketplace contract
        const approveOptions = {
            abi: nftAbi,
            contractAddress: collectionAddress,
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
            onSuccess: () =>
                handleMarketApproveSuccess(collectionAddress, tokenId, formattedPrice),
            onCancel: () => setLoading(false),
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => {
                console.log(error), setLoading(false), message.error(`List Item: Failed`)
            },
        })
    }

    async function handleMarketApproveSuccess(collectionAddress, tokenId, formattedPrice) {
        console.log("Ok! Now time to list")
        // define the "listItem" function call we need to interact with our marketplace contract
        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: collectionAddress,
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
            onError: (error) => {
                console.log(error), setLoading(false), message.error(`List Item: Failed`)
            },
        })
    }

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    async function handleListSuccess(tx) {
        // use async/await to make sure xaction goes through first before we show user the notification i.e. that we get a block confirmation
        await tx.wait(1)
        // close the modal
        handleCancelSellModal
        // send notification
        message.success(`NFT Listed!`)

        // Reload the page
        window.location.reload()
    }

    /////////////////////////////
    //  Auction Form Handlers  //
    /////////////////////////////

    const handleAuctionFormSubmit = (values) => {
        console.log("VALUES: ", values)

        const startDateString = new Date(values.dateRange[0].$d.setSeconds(0))
        const endDateString = new Date(values.dateRange[1].$d.setSeconds(0))

        const startTime = Math.floor(startDateString.getTime() / 1000)
        const endTime = Math.floor(endDateString.getTime() / 1000)

        const newAuction = {
            tokenId: tokenDetails.tokenId,
            collectionAddress: tokenDetails.collectionAddress,
            reservePrice: values.reservePrice,
            dateRange: [],
            startTime: startTime,
            endTime: endTime,
            minBidReservePrice: values.minBidReservePrice,
        }

        // setAuction(newAuction)

        approveAndCreateAuction(newAuction)

        console.log("handleAuctionFormSubmit complete")
    }

    ///////////////////////////////
    //  Create Auction Handlers  //
    ///////////////////////////////

    async function approveAndCreateAuction(newAuction) {
        console.log("Approving...")
        setLoading(true)

        console.log("newAuction_202: ", newAuction)

        const formattedResPrice = ethers.utils
            .parseUnits(newAuction.reservePrice.toString(), "ether")
            .toString()

        // define the "approve" function call we need to interact with our marketplace contract
        const approveOptions = {
            abi: nftAbi,
            contractAddress: newAuction.collectionAddress, // comes from props passed into "MY_NFTBox.js" from "my-nfts.js"
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
                    newAuction.collectionAddress,
                    newAuction.tokenId,
                    newAuction.startTime,
                    newAuction.endTime,
                    newAuction.minBidReservePrice,
                    formattedResPrice
                ),
            onCancel: () => setLoading(false),
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => {
                console.log(error), setLoading(false), message.error(`Auction Created: Failed`)
            },
        })
    }

    async function handleAuctionApproveSuccess(
        collectionAddress,
        tokenId,
        startTime,
        endTime,
        minBidReservePrice,
        formattedResPrice
    ) {
        console.log("Ok! Now time to create auction")
        console.log(
            "handleAuctionApproveSuccess: ",
            collectionAddress,
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
                nftAddress: collectionAddress,
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
            onError: (error) => {
                console.log(error), setLoading(false), message.error(`Auction Created: Failed`)
            },
        })
    }

    // tx param passed to this function automatically from onSuccess as it's the fallback function
    async function handleAuctionSuccess(tx) {
        // use async/await to make sure xaction goes through first before we show user the notification i.e. that we get a block confirmation
        await tx.wait(1)
        // close the modal
        handleCancelSellModal
        // send notification
        message.success(`Auction Created!`)

        // Reload the page
        window.location.reload()
    }

    //////////////////
    //  useEffects  //
    //////////////////

    useEffect(() => {
        console.log("auction_useEffect: ", auction)
    }, [auction])

    useEffect(() => {
        console.log("tokenDetails: ", tokenDetails)

        if (tokenDetails.tokenId && tokenDetails.collectionAddress) {
            setSaleTypeDisabled(false)
        } else {
            setSaleTypeDisabled(true)
        }
    }, [tokenDetails])

    return (
        <div>
            <Modal
                title={<div style={{ textAlign: "center" }}>Sell NFT</div>}
                open={showSellModal}
                onCancel={handleCancelSellModal}
                footer={null}
            >
                <Spin spinning={loading} tip={"Creating"}>
                    <Form
                        onValuesChange={(changedValues, allValues) =>
                            handleTokenDetailsChange(allValues)
                        }
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
                    >
                        <Form.Item
                            name="tokenId"
                            label="Token ID"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter the Token ID for the NFT you want to sell!",
                                },
                            ]}
                        >
                            <Input placeholder="Enter Token ID" type="number" />
                        </Form.Item>
                        <Form.Item
                            name="collectionAddress"
                            label="Contract Address"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter the Address for the NFT you want to sell!",
                                },
                            ]}
                        >
                            <Input placeholder="Enter Collection Address" />
                        </Form.Item>
                        <Form.Item
                            name="saleType"
                            label="Sale Type"
                            rules={[{ required: true, message: "Please select a Sale Type!" }]}
                        >
                            <Radio.Group disabled={saleTypeDisabled}>
                                <Radio.Button
                                    // style={{ width: "50%" }}
                                    value="List"
                                    onClick={() => handleOpenForm("List")}
                                >
                                    Fixed-Price
                                </Radio.Button>
                                <Radio.Button
                                    // style={{ width: "50%" }}
                                    value="Auction"
                                    onClick={() => handleOpenForm("Auction")}
                                >
                                    Timed Auction
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                    </Form>
                    {sellForm === "Auction" && (
                        <AuctionForm
                            handleCancelSellModal={handleCancelSellModal}
                            handleAuctionFormSubmit={handleAuctionFormSubmit}
                        />
                    )}
                    {sellForm === "List" && (
                        <ListForm
                            handleCancelSellModal={handleCancelSellModal}
                            handleListFormSubmit={handleListFormSubmit}
                        />
                    )}
                </Spin>
            </Modal>
        </div>
    )
}

const AuctionForm = ({ handleCancelSellModal, handleAuctionFormSubmit }) => {
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

    return (
        <Form
            id="auctionForm"
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
            onFinish={handleAuctionFormSubmit} // onFinish captures final form values
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
                label={
                    <span>
                        Auction Length&nbsp;
                        <Tooltip
                            title="Set a beginning and ending for your timed auction"
                            placement="right"
                        >
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
                {...rangeConfig}
            >
                <RangePicker name="dateRange" showTime format="DD-MM-YYYY HH:mm" />
            </Form.Item>
            <Form.Item
                wrapperCol={{
                    offset: 8,
                    span: 16,
                }}
            >
                <Button
                    type="danger"
                    size="large"
                    style={{ borderColor: "black", marginRight: "10px" }}
                    onClick={handleCancelSellModal}
                >
                    Cancel
                </Button>

                <Button
                    type="primary"
                    size="large"
                    style={{ backgroundColor: "#1890ff" }}
                    htmlType="submit"
                >
                    Submit
                </Button>
            </Form.Item>
        </Form>
    )
}

const ListForm = ({ handleCancelSellModal, handleListFormSubmit }) => {
    const [form] = Form.useForm()

    return (
        <Form
            id="fixedPriceForm"
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
            onFinish={handleListFormSubmit} // onFinish accurately captures final form values
        >
            <Form.Item
                name="listPrice"
                initialValue={0.1}
                rules={[
                    {
                        required: true,
                        message: "You must enter an amount!",
                    },
                    {
                        validator: (_, value) =>
                            value > 0.1
                                ? Promise.resolve()
                                : Promise.reject(new Error("Amount must be greater than to 0.1")),
                    },
                ]}
                label={
                    <span>
                        Price&nbsp;
                        <Tooltip title="Enter amount greater than 0.1" placement="right">
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
            >
                <InputNumber
                    name="listPrice"
                    style={{ width: "30%" }}
                    min="0.0001"
                    step="0.0001"
                />
            </Form.Item>
            <Form.Item
                wrapperCol={{
                    offset: 8,
                    span: 16,
                }}
            >
                <Button
                    type="danger"
                    size="large"
                    style={{ borderColor: "black", marginRight: "10px" }}
                    onClick={handleCancelSellModal} //         form.resetFields()
                >
                    Cancel
                </Button>

                <Button
                    type="primary"
                    size="large"
                    style={{ backgroundColor: "#1890ff" }}
                    htmlType="submit"
                >
                    Submit
                </Button>
            </Form.Item>
        </Form>
    )
}
