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
    PlusOutlined,
    SkypeFilled,
} from "@ant-design/icons"
import Link from "next/link"
import ImgCrop from "antd-img-crop"

import { useState } from "react"
const { Title } = Typography

/////////////////////
//  Configure IPFS //
/////////////////////

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
                <Input />
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
            >
                <Input />
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
    onFinish,
    initialValues,
    handlePrev,
    handleIpfsImageUpload,
}) => {
    // handler for image upload
    const handleUpload = ({ file, fileList }) => {
        setFileList(fileList)
        console.log("fileList_163", fileList)

        console.log(file, fileList)

        fileList.forEach((file) => {
            if (file.status === "done") {
                console.log(`${file.name} file uploaded successfully`)
            } else if (file.status === "error") {
                console.log(`${file.name} file upload failed.`)
            }
        })
    }

    const dummyRequest = ({ file, onSuccess }) => {
        setTimeout(() => {
            onSuccess("ok")
        }, 0)
    }

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
                name="artworkName"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label="Artwork Name"
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="artworkDescription"
                rules={[
                    {
                        required: true,
                    },
                ]}
                label="Artwork Description"
            >
                <Input.TextArea />
            </Form.Item>
            <Form.Item style={{ marginTop: "20px" }} name="uploadArtwork" label="Artwork">
                {/* To use Upload we must specify an endpoint for a file to be uploaded to. 
                If we need to perform any checks (e.g. file size) before uploading we can use "beforeUpload" instead of "action" */}
                <ImgCrop rotationSlider>
                    <Upload
                        multiple={false}
                        maxCount={1} // maxCount for uploaded files
                        listType="picture"
                        accept=".png, .jpg, .jpeg"
                        beforeUpload={handleIpfsImageUpload}
                        action="Placeholder" // action is a required prop; it will try and POST to the string and will fail which is fine
                        onChange={handleUpload} // called any time thre is a change in the file upload status
                        fileList={fileList} // list of all uploaded files
                        customRequest={dummyRequest}
                    >
                        <Button icon={<UploadOutlined />}>Click to Upload</Button>
                    </Upload>
                </ImgCrop>
            </Form.Item>
            <Form.List name="artworkAttributes">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map((field, index) => (
                            <Space
                                key={index}
                                style={{ display: "flex", marginBottom: 8 }}
                                align="baseline"
                            >
                                <Form.Item
                                    {...field}
                                    name={[field.name, "Trait"]}
                                    label={`Attribute ${index + 1}`}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item {...field} name={[field.name, "Value"]} label="Value">
                                    <InputNumber min={0} max={100} />
                                </Form.Item>
                                <Button type="danger" onClick={() => remove(field.name)}>
                                    X
                                </Button>
                            </Space>
                        ))}
                        {fields.length < 3 && (
                            <Space style={{ display: "flex", justify: "center" }}>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                    style={{ marginBottom: "20px" }}
                                >
                                    Add Artwork Attribute
                                </Button>
                            </Space>
                        )}
                    </>
                )}
            </Form.List>
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
