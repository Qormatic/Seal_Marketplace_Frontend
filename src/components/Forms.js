import {
    Avatar,
    Row,
    Button,
    Modal,
    Form,
    Select,
    Tooltip,
    Input,
    DatePicker,
    InputNumber,
    Steps,
    Upload,
    Space,
    Spin,
    message,
    Typography,
} from "antd"
import {
    FileSearchOutlined,
    ShoppingCartOutlined,
    InfoCircleOutlined,
    BorderBottomOutlined,
    UploadOutlined,
    InboxOutlined,
    PlusOutlined,
    SkypeFilled,
} from "@ant-design/icons"
import Link from "next/link"
import ImgCrop from "antd-img-crop"
import CryptoJS from "crypto-js"
import { create } from "ipfs-http-client"

import { useState } from "react"
const { Title } = Typography

/////////////////////
//  Configure IPFS //
/////////////////////

/* configure Infura auth settings */
const projectId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID
const projectSecret = process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET
const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64")

/* Create an instance of the client */
const client = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
        authorization: auth,
    },
})

export const CollectionForm = ({ onFinish, initialValues }) => {
    return (
        <Form
            onFinish={onFinish}
            initialValues={initialValues}
            labelCol={{
                span: 10,
            }}
            wrapperCol={{
                span: 12,
            }}
            layout="horizontal"
            style={{
                maxWidth: 600,
            }}
        >
            <Form.Item
                name="collectionName"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label={
                    <span>
                        Collection Name&nbsp;
                        <Tooltip title="Choose a name for your collection" placement="right">
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
                initialValue="The Amazing Collection"
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="collectionSymbol"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label={
                    <span>
                        Collection Symbol&nbsp;
                        <Tooltip title="Choose a symbol for your collection" placement="right">
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
                initialValue="ACN"
            >
                <Input style={{ width: "40%" }} />
            </Form.Item>
            <Form.Item
                name="supply"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label={
                    <span>
                        Number of Tokens&nbsp;
                        <Tooltip
                            title="How many tokens do you want in your collection?"
                            placement="right"
                        >
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
                initialValue="100"
            >
                <InputNumber min={1} max={1000} />
            </Form.Item>
            <Form.Item
                name="royaltiesPercentage"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label={
                    <span>
                        Royalties Percentage&nbsp;
                        <Tooltip
                            title="Set a Secondary Sale royalty percentage for your collection"
                            placement="right"
                        >
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
                initialValue="12"
            >
                <InputNumber min={0} max={20} />
            </Form.Item>
            <Form.Item
                name="royaltiesReceiver"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label={
                    <span>
                        Royalties Receiver&nbsp;
                        <Tooltip
                            title="Set a valid receiver address for any Secondary Sales payable from this collection"
                            placement="right"
                        >
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
                initialValue="0x70bCA05c07991398B96207516f3a9D0817Eaff51"
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="privateView"
                rules={[
                    {
                        required: true,
                        message: "Please select true or false!",
                    },
                ]}
                label={
                    <span>
                        Private Visbility&nbsp;
                        <Tooltip
                            title="Set visibility of NFT imsages minted from this collection to private"
                            placement="right"
                        >
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
                initialValue="True"
            >
                <Select
                    name="privateView"
                    options={[
                        { label: "True", value: "true" },
                        { label: "False", value: "false" },
                    ]}
                    style={{ width: "40%" }}
                    placeholder="Select"
                />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "center" }}>
                <Button type="primary" htmlType="submit" style={{ backgroundColor: "#1890ff" }}>
                    Continue
                </Button>
            </div>
        </Form>
    )
}

export const ArtworkForm = ({
    setFileList,
    fileList,
    setMetadataFileList,
    metadataFileList,
    setImageCIDs,
    setIpfsImagesUri,
    // onFinish,
    initialValues,
    handlePrev,
    // handleIpfsImageUpload,
}) => {
    // handler for managing the fileList
    const handleOnChange = ({ file, fileList }) => {
        if (file.status !== "uploading") {
            console.log(file, fileList)
        }
        if (file.status === "done") {
            message.success(`${file.name} file uploaded successfully`)
        } else if (file.status === "error") {
            message.error(`${file.name} file upload failed.`)
        }
        setFileList(fileList)
        console.log("fileList: ", fileList)
    }

    const handleIpfsImageUpload = async (values) => {
        console.log("fileList: ", values)
        let fileList = values.uploadArtwork.fileList

        const filePromises = fileList.map((file) => transformFile(file))

        const transformedFiles = await Promise.all(filePromises)

        console.log("transformedFiles: ", transformedFiles)
        console.log(transformedFiles[0].blob)
        console.log(transformedFiles[0].fileName)

        message.success("Uploading data to the server!")

        // Prepare files for the directory
        const directory = transformedFiles.map((file, i) => ({
            path: `/${file.fileName}`, // use the original file's name
            content: file.blob,
        }))

        console.log("directory: ", directory)

        let ipfsUris = []
        let fileResults = []
        let directoryCid = null

        try {
            // loop that iterates over each item returned by the addAll method
            // Each item is an object with details about one file or directory that was added to IPFS
            for await (const result of client.addAll(directory, { wrapWithDirectory: true })) {
                console.log("result: ", result)

                // Check if the path is empty; meaning it's the directory
                // Directory cid should be the last returned
                if (result.path === "") {
                    directoryCid = result.cid.toString()
                } else {
                    // For each file, store the result in an array to be processed later
                    fileResults.push(result)
                }
            }
            // After the loop, we should have the directory CID, so now we can generate the URIs for the files
            fileResults.forEach((result) => {
                ipfsUris.push(`https://ipfs.io/ipfs/${directoryCid}/${result.path}`)
            })
        } catch (err) {
            console.error("Error uploading to IPFS: ", err)
            message.error("Error uploading to IPFS!")
            return
        }

        console.log("ipfsUris: ", ipfsUris)

        // setIpfsImagesUri()

        message.success("Images uploaded to IPFS successfully!")
    }

    const transformFile = (file) => {
        console.log("file: ", file)
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file.originFileObj)

            reader.onload = function (event) {
                const arrayBuffer = event.target.result
                const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer))

                const encrypted = CryptoJS.AES.encrypt(
                    wordArray,
                    process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY
                ).toString()

                const encryptedDataWithFileType = {
                    fileType: file.type,
                    encryptedData: encrypted,
                }

                const blob = new Blob([JSON.stringify(encryptedDataWithFileType)], {
                    type: "application/json",
                })

                const blobject = {
                    fileName: file.name,
                    blob: blob,
                }

                resolve(blobject)
            }

            reader.onerror = function (error) {
                reject(error)
            }
        })
    }

    // simulate successful file upload
    const dummyRequest = ({ file, onSuccess }) => {
        setTimeout(() => {
            onSuccess("ok")
        }, 0)
    }

    return (
        <Form
            onFinish={handleIpfsImageUpload}
            initialValues={initialValues}
            labelCol={{
                span: 10,
            }}
            wrapperCol={{
                span: 12,
            }}
            layout="horizontal"
            style={{
                maxWidth: 600,
            }}
        >
            <Form.Item
                style={{ marginTop: "20px" }}
                name="uploadArtwork"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label={
                    <span>
                        Upload Images&nbsp;
                        <Tooltip title="Drag and Drop up to 200 image files" placement="right">
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
            >
                {/* To use Upload we must specify an endpoint for a file to be uploaded to. 
                If we need to perform any checks (e.g. file size) before uploading we can use "beforeUpload" instead of "action" */}
                <Upload.Dragger
                    multiple={true}
                    maxCount={10} // maxCount for uploaded files
                    listType="picture"
                    accept=".png, .jpg, .jpeg"
                    beforeUpload={() => false} // use beforeUpload as without server we've nowhere to upload - will process files one by one
                    action="Placeholder" // action is a required prop; it will try and POST to the string and will fail which is fine
                    fileList={fileList} // list of all uploaded files
                    onChange={handleOnChange} // called any time there is a change in file status
                    customRequest={dummyRequest}
                    onDrop={(e) => {
                        console.log("Dropped files", e.dataTransfer.files)
                        // handleIpfsImageUpload(e.dataTransfer.files)
                    }}
                >
                    {/* <Button icon={<UploadOutlined />}>Click to Upload</Button> */}
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                </Upload.Dragger>
            </Form.Item>
            {/* <Form.Item
                style={{ marginTop: "20px" }}
                name="uploadMetadata"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label={
                    <span>
                        Upload Metadata&nbsp;
                        <Tooltip
                            title="Please a single metadata file that corresponds to your images image"
                            placement="right"
                        >
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
            > */}
            {/* To use Upload we must specify an endpoint for a file to be uploaded to. 
                If we need to perform any checks (e.g. file size) before uploading we can use "beforeUpload" instead of "action" */}
            {/* <Upload
                    multiple={false}
                    maxCount={1} // maxCount for uploaded files
                    listType="text"
                    accept=".csv"
                    beforeUpload={() => false} // use beforeUpload as without server we've nowhere to upload - will process files one by one
                    action="Placeholder" // action is a required prop; it will try and POST to the string and will fail which is fine
                    fileList={metadataFileList} // list of all uploaded files
                    onChange={handleOnChange} // called any time there is a change in file status
                    customRequest={dummyRequest}
                >
                    <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
            </Form.Item> */}
            <Row justify="center">
                <Button onClick={handlePrev} style={{ marginRight: 20 }}>
                    Previous
                </Button>
                {/* htmlType="submit" submits the form; onClick triggers "handleSubmit" */}
                <Button type="primary" htmlType="submit" style={{ backgroundColor: "#1890ff" }}>
                    Finish
                </Button>
            </Row>
        </Form>
    )
}

export const FinishAndPayForm = ({
    createContract,
    contractCreated,
    mintNFT,
    nftMinted,
    newContractDetails,
}) => {
    return !contractCreated ? (
        <div style={{ textAlign: "center" }}>
            <Title level={4}>Create your contract! </Title>
            <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                    type="primary"
                    htmlType="submit"
                    onClick={createContract}
                    style={{ backgroundColor: "#1890ff", margin: "10px" }}
                >
                    Create Contract
                </Button>
            </div>
        </div>
    ) : !nftMinted ? (
        <div style={{ textAlign: "center", justifyContent: "center" }}>
            <Title level={4}>Mint your NFT now!</Title>
            <Button
                type="primary"
                onClick={mintNFT}
                style={{ backgroundColor: "#1890ff", margin: "10px" }}
            >
                Mint Now
            </Button>
            <div style={{ fontSize: "30px" }}>🥷</div>
        </div>
    ) : (
        <div style={{ textAlign: "center", justifyContent: "center" }}>
            <Title level={4}>Go to your profile to list your NFT for sale</Title>
            <Link href={`/profile/${newContractDetails.creator}`}>
                <Button type="primary" style={{ backgroundColor: "#1890ff", margin: "10px" }}>
                    View in Profile
                </Button>
            </Link>
            <div style={{ fontSize: "30px" }}>🥷</div>
        </div>
    )
}

export const MintForm = ({
    createContract,
    contractCreated,
    mintNFT,
    nftMinted,
    newContractDetails,
}) => {
    return !contractCreated ? (
        <>
            <div>Press Create Contract to pay fee and create your contract! </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                    type="primary"
                    htmlType="submit"
                    onClick={createContract}
                    style={{ backgroundColor: "#1890ff" }}
                >
                    Continue
                </Button>
            </div>
        </>
    ) : (
        <>
            <div>You can now mint an NFT</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
                <Button type="primary" disabled={nftMinted} onClick={mintNFT}>
                    Mint Now
                </Button>
            </div>
            {nftMinted ? (
                <div>
                    <div>Go to your profile to list the NFT for sale</div>
                    <div style={{ display: "flex", justifyContent: "center" }}></div>
                    <Link href={`/profile/${newContractDetails.creator}`}>
                        <Button>View in Profile</Button>
                    </Link>
                </div>
            ) : (
                <div style={{ fontSize: "30px" }}>🥷</div>
            )}
        </>
    )
}
