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
            >
                <InputNumber min={1} max={200} />
            </Form.Item>
            <Form.Item
                name="royaltiesPercentage"
                rules={[
                    {
                        required: true, // mandatory in contracts atm
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
            >
                <InputNumber min={0} max={20} />
            </Form.Item>
            <Form.Item
                name="royaltiesReceiver"
                rules={[
                    {
                        required: true, // mandatory in contracts atm
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
    handlePrev,
    setCurrentStep,
    encryptImage,
    setArtworkData,
    initialValues,
}) => {
    console.log("encryptImage: ", encryptImage)

    const [artworkFileList, setArtworkFileList] = useState([])
    const [metadataFileList, setMetadataFileList] = useState([])

    /* 
       Because of asynchronicity/data availability in React/Next we don't use CSVData nor IpfsImagesUri directly below.
       Rather we create newCSVData & newIpfsImagesUri to avoid risk of CSVData & IpfsImagesUri not being available in time to continue processing.
       For now these state variables are redundant but have left them in; in case we use them for something else
     */
    const [CSVData, setCSVData] = useState({})
    const [IpfsImagesUri, setIpfsImagesUri] = useState([])

    /* 
    ///////////////
    //  storage  //
    ///////////////
    
        Our metadataFilelist and artworkFileList are stored in the component's state.
        State is in memory and will be cleared once the page is refreshed or the component is unmounted. 
    
    ////////////////////
    //  beforeupload  //
    ////////////////////

        To use antD's Upload component normally you specify an endpoint for a file to be uploaded to
        This will automatically upload the file to the server and update file.status to reflect progress as "uploading", "done", "error"
        
        Although we don't have an endpoint we can use beforeUpload to manually control upload process
            --> beforeUpload={() => false} prevents automatic upload of the file to the server because we dont have one and returns no status
            --> Returning false indicates that we will handle the upload manually so the upload process stops & our files will be given no shtatus 
                by upload component
            --> Can also perform any checks (e.g. file size, duplicate file name) "beforeUpload"
        
        Our custom beforeUpload function sets file shtatus to "uploading" before manually calling the onChange function
        Then, we return false to stop the automatic upload process
    */

    const handleArtworkBeforeUpload = (file) => {
        file.status = "uploading" // set file status manually
        handleArtworkChange({ file, fileList: [...artworkFileList, file] })
        return false
    }

    const handleMetadataBeforeUpload = (file) => {
        file.status = "uploading" // set file status manually
        handleMetadataChange({ file, fileList: [...metadataFileList, file] })
        return false
    }

    ////////////////////////
    //  FileList changes  //
    ////////////////////////

    /* file is the file that triggered onChange
         fileList is the updated list after onChange */
    const handleArtworkChange = ({ file, fileList }) => {
        console.log("ON_CHANGE_ART: ", file, fileList)

        if (file.status === "uploading") {
            const doesFileExist = fileList.some(
                (existingFile) => existingFile.name === file.name && existingFile.uid !== file.uid
            )
            if (doesFileExist) {
                message.error(`File named ${file.name} already exists.`)
                // filter out the new file with duplicate name
                const filteredFileList = fileList.filter(
                    (f) => !(f.name === file.name && f.uid === file.uid)
                )
                setArtworkFileList(filteredFileList)
                return
            }
        }

        setArtworkFileList(fileList)
        console.log("Artwork_fileList: ", fileList)
    }

    const handleMetadataChange = ({ file, fileList }) => {
        if (file.status === "uploading") {
            message.success(`${file.name} file uploaded successfully`)
        }
        setMetadataFileList(fileList)
        console.log("Metadata_fileList: ", fileList)
    }

    ////////////////////////////
    //  File Remove from List //
    ////////////////////////////

    const onArtworkRemove = (file) => {
        const index = artworkFileList.indexOf(file)
        const newFileList = artworkFileList.slice()
        newFileList.splice(index, 1)
        setArtworkFileList(newFileList)

        console.log("ON_REMOVE_ART: ", file, newFileList)
    }

    const onMetadataRemove = (file) => {
        const index = metadataFileList.indexOf(file)
        const newFileList = metadataFileList.slice()
        newFileList.splice(index, 1)
        setMetadataFileList(newFileList)

        console.log("ON_REMOVE_META: ", file, newFileList)
    }

    ///////////////////////
    //  onFinish handler //
    ///////////////////////

    async function handleSubmission(values) {
        console.log("handleSubmission_values: ", values)

        try {
            setLoading(true)

            setArtworkData(values)

            // Assuming handleIpfsImageUpload returns a Promise
            const newIpfsImagesUri = await handleIpfsImageUpload(values.uploadArtwork)

            // Now that handleIpfsImageUpload has completed, we start handleCSVUpload using the state variable directly
            const newCSVData = await handleCSVUpload()

            const metadata = await uploadMetadata(newIpfsImagesUri, newCSVData)

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
        console.log("fileList: ", fileList)

        // create promise for each image
        const filePromises = fileList.map((file) => transformFile(file))

        // wait for all promises to complete
        const transformedFiles = await Promise.all(filePromises)

        console.log("transformedFiles: ", transformedFiles)

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

        setIpfsImagesUri(ipfsUris)

        message.success("Images uploaded to IPFS successfully!")

        return ipfsUris
    }

    const transformFile = (file) => {
        console.log("file: ", file)
        console.log("originFileObj: ", file.originFileObj)

        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onloadstart = function (event) {
                console.log("File reading started")
            }

            reader.onloadend = function (event) {
                console.log("File reading finished")
            }

            reader.readAsArrayBuffer(file.originFileObj)

            reader.onload = function (event) {
                console.log("File has been read as an ArrayBuffer")

                if (encryptImage === "true") {
                    console.log("event.target.result: ", event.target.result)

                    console.log("True gate passed")
                    console.log(`Encrypting Image ${file.name}`)
                    const arrayBuffer = event.target.result
                    console.log("arrayBuffer gate passed: ", arrayBuffer)

                    const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer))
                    console.log("wordArray gate passed: ", wordArray)

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
                // } else {
                //     console.log(`Not Encrypting Image ${file.name}`)

                //     const blob = new Blob([event.target.result], {
                //         type: file.type,
                //     })

                //     const blobject = {
                //         fileName: file.name,
                //         blob: blob,
                //     }

                //     resolve(blobject)
                // }
            }

            reader.onerror = function (error) {
                console.log("An error occurred while reading the file", error)
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

                const reader = new FileReader()
                reader.readAsText(file)

                reader.onload = (e) => {
                    const CSVData = e.target.result
                    const jsonData = Papa.parse(CSVData, { header: true }).data // parse file into JSON and store it in state
                    setCSVData(jsonData)
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
                <Upload
                    multiple={false}
                    maxCount={1}
                    accept=".csv"
                    listType="picture"
                    beforeUpload={handleMetadataBeforeUpload}
                    fileList={metadataFileList} // list of all uploaded files
                    onChange={handleMetadataChange} // called any time there is a change in file status
                    showUploadList={false}
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
                <Upload.Dragger
                    fileList={null} // using custom fileList below
                    multiple={true}
                    maxCount={200} // maxCount for uploaded files
                    listType="picture"
                    accept=".png, .jpg, .jpeg"
                    beforeUpload={handleArtworkBeforeUpload}
                    onChange={handleArtworkChange} // called any time there is a change in file status
                    showUploadList={false}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text" style={{ fontSize: "14px" }}>
                        Click or drag files to this area to upload
                    </p>
                </Upload.Dragger>
            </Form.Item>
            {artworkFileList.length > 0 && ( // dont display list if no data
                <div
                    style={{
                        width: "100%",
                        maxHeight: "250px",
                        overflow: "auto",
                        marginTop: "20px",
                    }}
                >
                    <List
                        itemLayout="horizontal"
                        dataSource={artworkFileList}
                        renderItem={(file) => (
                            <List.Item
                                style={{
                                    border: "1px solid",
                                    borderColor: "#bfbfbf",
                                    borderRadius: "5px",
                                    padding: "5px",
                                    marginBottom: "5px",
                                    width: "100%",
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
                                            src={
                                                file.originFileObj
                                                    ? URL.createObjectURL(file.originFileObj)
                                                    : ""
                                            }
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
    handleCloseCreateModal,
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
            <Link href={`/profile/${newContractDetails.creator}`} onClick={handleCloseCreateModal}>
                <Button type="primary" style={{ backgroundColor: "#1890ff", margin: "10px" }}>
                    View in Profile
                </Button>
            </Link>
            <div style={{ fontSize: "30px" }}>🥷</div>
        </div>
    )
}
