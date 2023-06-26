import {
    Avatar,
    Row,
    Button,
    Modal,
    Form,
    Select,
    Tooltip,
    Input,
    List,
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
    FileOutlined,
    InboxOutlined,
    DeleteOutlined,
    PaperClipOutlined,
    PlusOutlined,
    SkypeFilled,
} from "@ant-design/icons"
import Link from "next/link"
import ImgCrop from "antd-img-crop"
import CryptoJS from "crypto-js"
import { create } from "ipfs-http-client"
import Papa from "papaparse"

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

export const CollectionForm = ({ setCurrentStep, setCollectionData, initialValues }) => {
    ///////////////////////////
    //  Form Finish Handlers //
    ///////////////////////////

    const handleFinishCollection = (values) => {
        console.log("Values: ", values)

        setCollectionData(values)

        setCurrentStep(1)
    }

    return (
        <Form
            onFinish={handleFinishCollection}
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
                initialValue="0"
            >
                <InputNumber min={1} max={200} />
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
                initialValue="0"
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
                        Private View&nbsp;
                        <Tooltip
                            title="Setting to private makes minted NFT images visible only to the NFT's owner."
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
    setLoading,
    setBaseUri,
    initialValues,
    handlePrev,
    setCurrentStep,
    encryptImage,
}) => {
    ////////////////////////////
    //  File Remove from List //
    ////////////////////////////

    console.log("encryptImage: ", encryptImage)

    const [fileList, setFileList] = useState([])
    const [metadataFileList, setMetadataFileList] = useState([])
    const [CSVData, setCSVData] = useState({})
    const [IpfsImagesUri, setIpfsImagesUri] = useState([])

    const handleArtworkChange = ({ file, fileList }) => {
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

    const handleMetadataChange = ({ file, fileList }) => {
        // for CSV files, as opposed to images, we need to parse the file content into a more usable format (e.g., JSON) in this handler.
        // Images don't need to be parsed like this because they are used in their raw format (e.g., .jpeg, .png, etc.)
        // But CSV files are text files that represent tabular data and need to be parsed into a suitable data structure for further processing.

        if (file.status !== "uploading") {
            console.log(file, fileList)
        }
        if (file.status === "done") {
            message.success(`${file.name} file uploaded successfully`)

            const reader = new FileReader()
            reader.readAsText(file.originFileObj) // Reads the file content as text

            // trigger onload when finished reading
            reader.onload = (e) => {
                const data = Papa.parse(reader.result, { header: true }).data // reader.result contains the UNPARSED contents of the file
                setCSVData(data)
                console.log("CSVData after set:", data)
            }
        } else if (file.status === "error") {
            message.error(`${file.name} file upload failed.`)
        }
        setMetadataFileList(fileList)
        console.log("fileList: ", fileList)
    }

    ////////////////////////////
    //  File Remove from List //
    ////////////////////////////

    const onArtworkRemove = (file) => {
        const index = fileList.indexOf(file)
        const newFileList = fileList.slice()
        newFileList.splice(index, 1)
        setFileList(newFileList)
    }

    const onMetadataRemove = (file) => {
        const index = metadataFileList.indexOf(file)
        const newFileList = metadataFileList.slice()
        newFileList.splice(index, 1)
        setMetadataFileList(newFileList)
    }

    ///////////////////////
    //  onFinish handler //
    ///////////////////////

    async function handleSubmission(values) {
        console.log("handleSubmission_values: ", values)

        try {
            setLoading(true)

            // Assuming handleIpfsImageUpload returns a Promise
            const newIpfsImagesUri = await handleIpfsImageUpload(values.uploadArtwork)

            // Now that handleIpfsImageUpload has completed, we start handleCSVUpload using the state variable directly
            const newCSVData = await handleCSVUpload()

            const metadata = await uploadMetadata(newIpfsImagesUri, newCSVData)

            console.log(metadata)
            setLoading(false) // Now that all operations have completed, we stop the loading indicator
        } catch (error) {
            message.error("Upload Error, please try again in a while. You have not been charged.")
            console.error("An error occurred during submission", error)
            setLoading(false)
        }
    }

    //////////////////////////////////////////
    //  Encrypt Images & Save CIDs to State //
    //////////////////////////////////////////

    const handleIpfsImageUpload = async (artwork) => {
        console.log("images: ", artwork)
        let fileList = artwork.fileList

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
            throw err
        }

        console.log("ipfsUris: ", ipfsUris)

        setIpfsImagesUri(ipfsUris)

        message.success("Images uploaded to IPFS successfully!")

        return ipfsUris
    }

    const transformFile = (file) => {
        console.log("encryptImage: ", encryptImage)

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file.originFileObj)

            reader.onload = function (event) {
                if (encryptImage === true) {
                    console.log(`Encrypting Image ${file.name}`)
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
                } else {
                    console.log(`Not Encrypting Image ${file.name}`)

                    const blob = new Blob([event.target.result], {
                        type: file.type,
                    })

                    const blobject = {
                        fileName: file.name,
                        blob: blob,
                    }

                    resolve(blobject)
                }
            }

            reader.onerror = function (error) {
                reject(error)
            }
        })
    }

    ///////////////////////////////////////////
    //  Extract CSV metadata & save to State //
    ///////////////////////////////////////////

    const handleCSVUpload = async () => {
        return new Promise((resolve, reject) => {
            // Check if a file is available
            if (metadataFileList.length > 0) {
                // Get the first (and only) file from the list
                const file = metadataFileList[0].originFileObj
                console.log("file: ", file)

                const reader = new FileReader()
                reader.readAsText(file)

                reader.onload = (e) => {
                    const CSVData = e.target.result
                    const jsonData = Papa.parse(CSVData, { header: true }).data // parse file into JSON and store it in state
                    setCSVData(jsonData)
                    console.log(jsonData) // Display the processed data

                    resolve(jsonData) // Resolve the promise with the parsed data
                }

                reader.onerror = (err) => {
                    console.error("Failed to read file!", err)
                    reject(err) // Reject the promise with the error
                }
            } else {
                console.error("No file available to upload")
                reject(new Error("No file available to upload")) // Reject the promise with an error
            }
        })
    }

    /////////////////////////////////////////
    //  Create metadata and upload to IPFS //
    /////////////////////////////////////////

    const uploadMetadata = async (IpfsImagesUri, CSVData) => {
        console.log("IpfsImagesUri: ", IpfsImagesUri)
        console.log("CSVData: ", CSVData)

        if (IpfsImagesUri.length !== CSVData.length) {
            throw new Error("Mismatch in the number of URIs and CSV data records.")
        }

        const IPFSMetadata = CSVData.map((data, index) => {
            const filenameFromURI = IpfsImagesUri[index].split("/").pop()
            const filenameFromData = data.filename

            if (filenameFromURI !== filenameFromData) {
                throw new Error(
                    `Mismatch in filename at index ${index}. URI: ${filenameFromURI}, CSV: ${filenameFromData}`
                )
            }

            return {
                ...data, // unpack the object
                image: IpfsImagesUri[index],
            }
        })

        console.log("IPFSMetadata: ", IPFSMetadata)

        // Prepare files for the directory
        const directory = IPFSMetadata.map((metadata, index) => {
            const metadataJSON = JSON.stringify(metadata)
            const blob = new Blob([metadataJSON], { type: "application/json" })
            return {
                path: `/${metadata.filename.replace(".png", ".json")}`,
                content: blob,
            }
        })

        let directoryCid = null

        try {
            for await (const result of client.addAll(directory, { wrapWithDirectory: true })) {
                console.log("result: ", result)

                //  if result.path = "" its the directory cid
                if (result.path === "") {
                    directoryCid = result.cid.toString()
                }
            }
        } catch (err) {
            console.error("Error uploading to IPFS: ", err)
            message.error("Error uploading to IPFS!")
            throw err
        }

        const baseUri = `https://ipfs.io/ipfs/${directoryCid}/`
        setBaseUri(baseUri)

        console.log("baseUri: ", baseUri)

        setCurrentStep(2)
    }

    return (
        <Form
            onFinish={handleSubmission}
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
                style={{ marginTop: "20px", width: "100%" }}
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
                            title="Please a single metadata file that corresponds to your images"
                            placement="right"
                        >
                            <InfoCircleOutlined />
                        </Tooltip>
                    </span>
                }
            >
                {/* To use Upload we must specify an endpoint for a file to be uploaded to. 
                If we need to perform any checks (e.g. file size) before uploading we can use "beforeUpload" instead of "action" */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Upload
                        multiple={false}
                        maxCount={1} // maxCount for uploaded files
                        accept=".csv"
                        listType="picture"
                        beforeUpload={() => false} // use beforeUpload as without server we've nowhere to upload - will process files one by one
                        action="Placeholder" // action is a required prop; it will try and POST to the string and will fail which is fine
                        fileList={metadataFileList} // list of all uploaded files
                        onChange={handleMetadataChange} // called any time there is a change in file status
                        // customRequest={dummyRequest}
                        showUploadList={false}

                        // style={{ width: "150%" }}
                    >
                        <div style={{ width: "155%" }}>
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                            {metadataFileList.length > 0 && ( // dont display list if no data
                                <div
                                    style={{
                                        maxHeight: "200px",
                                        overflow: "auto",
                                        marginTop: "20px",
                                    }}
                                >
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={metadataFileList}
                                        renderItem={(file) => (
                                            <List.Item
                                                style={{
                                                    border: "1px solid",
                                                    borderColor: "#bfbfbf",
                                                    borderRadius: "5px",
                                                    padding: "5px",
                                                    marginBottom: "5px",
                                                }}
                                                actions={[
                                                    <Button
                                                        style={{ border: "none" }}
                                                        onClick={(e) => {
                                                            e.stopPropagation() // stop onclick from opening file explorer
                                                            onMetadataRemove(file)
                                                        }}
                                                        icon={
                                                            <DeleteOutlined
                                                                style={{
                                                                    color: "#f5222d",
                                                                    border: "none",
                                                                }}
                                                            />
                                                        }
                                                    />,
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    style={{ alignItems: "center" }}
                                                    avatar={
                                                        <PaperClipOutlined
                                                            style={{
                                                                fontSize: "25px",
                                                                color: "#1677ff",
                                                            }}
                                                        />
                                                    }
                                                    title={
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: "14px",
                                                                }}
                                                            >
                                                                {file.name.length > 15 // prevent overflow
                                                                    ? `${file.name.substring(
                                                                          0,
                                                                          15
                                                                      )}...`
                                                                    : file.name}
                                                            </span>
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </Upload>
                </div>
            </Form.Item>
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
                    maxCount={200} // maxCount for uploaded files
                    listType="picture"
                    accept=".png, .jpg, .jpeg"
                    beforeUpload={() => false} // use beforeUpload as without server we've nowhere to upload - will process files one by one
                    action="Placeholder" // action is a required prop; it will try and POST to the string and will fail which is fine
                    // customRequest={dummyRequest}
                    onChange={handleArtworkChange} // called any time there is a change in file status
                    showUploadList={false}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text" class={{ fontSize: "14px" }}>
                        Click or drag files to this area to upload
                    </p>
                </Upload.Dragger>
                {fileList.length > 0 && ( // dont display list if no data
                    <div style={{ maxHeight: "250px", overflow: "auto", marginTop: "20px" }}>
                        <List
                            itemLayout="horizontal"
                            dataSource={fileList}
                            renderItem={(file) => (
                                <List.Item
                                    style={{
                                        border: "1px solid",
                                        borderColor: "#bfbfbf",
                                        borderRadius: "5px",
                                        padding: "5px",
                                        marginBottom: "5px",
                                    }} // Rounded grey border
                                    actions={[
                                        <Button
                                            style={{ border: "none" }}
                                            onClick={() => onArtworkRemove(file)}
                                            icon={
                                                <DeleteOutlined
                                                    style={{ color: "#f5222d", border: "none" }}
                                                />
                                            }
                                        />,
                                    ]}
                                >
                                    <List.Item.Meta
                                        style={{ alignItems: "center" }}
                                        avatar={
                                            <img
                                                src={URL.createObjectURL(file.originFileObj)}
                                                style={{ width: "50px" }}
                                            />
                                        }
                                        title={
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    fontSize: "14px",
                                                    whiteSpace: "nowrap", // Prevent text from wrapping onto new lines
                                                    overflow: "hidden", // Prevent text from overflowing container
                                                    textOverflow: "ellipsis", // Add '...' to end of text if it overflows container
                                                    maxWidth: "150px", // Set a maximum width for the text container
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    {file.name.length > 15 // prevent overflow
                                                        ? `${file.name.substring(0, 15)}...`
                                                        : file.name}
                                                </span>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                )}
            </Form.Item>
            <Row justify="center">
                <Button onClick={handlePrev} style={{ marginRight: 20 }}>
                    Previous
                </Button>
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
    // Add this line to store the number input
    const [mintAmount, setMintAmount] = useState(0)

    // Define the handle function for number input changes
    const handleNumberChange = (value) => {
        console.log("Value: ", value)
        setMintAmount(value)
    }

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
            <Form.Item name="mintAmount" label="Number of NFTs to mint" initialValue="0">
                <InputNumber min={1} max={200} value={mintAmount} onChange={handleNumberChange} />
            </Form.Item>
            <Button
                type="primary"
                onClick={() => mintNFT(mintAmount)} // Pass the mintAmount to mintNFT function
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

export const MintForm = ({ mintNFT, nftMinted }) => {
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
