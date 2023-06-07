import { ConnectButton } from "web3uikit"
import { Chains, ChainsTwo } from "@/components/Chains/Chains"
import { CollectionForm, ArtworkForm, FinishAndPayForm } from "@/components/Forms"
import Link from "next/link"
import { useRouter } from "next/router"
import { ethers } from "ethers"
import nftMarketplaceAbi from "@/constants/MP_NFTMarketplace.json"
import contractAbi from "@/constants/MP_721_Contract.json"
import { create } from "ipfs-http-client"
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
import styles from "@/styles/components.module.css"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { useState } from "react"
import { networkMapping } from "@/constants"

const { Step } = Steps

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

export function Header() {
    const router = useRouter()
    const { account } = useMoralis()
    const [showModal, setShowModal] = useState(false)

    /////////////////////
    //  Modal Handlers //
    /////////////////////

    const handleButtonClick = () => {
        // We open Create Contract modal
        setShowModal(true)
    }

    const handleCancel = () => {
        // We close Create Contract modal
        setShowModal(false)
    }

    ///////////////////////////////////
    //  Check is user has a profile  //
    ///////////////////////////////////

    const handleProfileLinkClick = (e) => {
        e.preventDefault()
        const profileUrl = `/profile/${account}`
        router.push(profileUrl).catch(() => {
            router.push("/profile/myProfile")
        })
    }

    return (
        <>
            <nav className="p-5 flex flex-row justify-between items-center">
                <h1 className="py-4 px-4 font-bold text-4xl">Marcopolo</h1>
                <div className="flex flex-row items-center">
                    <Link href="/" passHref>
                        <a className="mr-4 p-6">🚀 Explore Market</a>
                    </Link>
                    <Link href={`/profile/${account}`} passHref>
                        <a className="mr-4 p-6" onClick={handleProfileLinkClick}>
                            🖼 My Profile
                        </a>
                    </Link>
                    <Button
                        onClick={() => handleButtonClick()}
                        style={{
                            backgroundColor: "none",
                            borderStyle: "hidden",
                            cursor: "pointer",
                            fontSize: "16px",
                            marginRight: "40px",
                            padding: 0,
                            textAlign: "left",
                            width: "auto",
                        }}
                    >
                        🧙‍♂️ Create Collection
                    </Button>
                    <Chains />
                    <ConnectButton moralisAuth={false} />
                </div>
            </nav>
            <CollectionModal
                showModal={showModal}
                setShowModal={setShowModal}
                handleCancel={handleCancel}
            />
        </>
    )
}

export function ProfileHeader() {
    const { account } = useMoralis()
    const [showModal, setShowModal] = useState(false)

    /////////////////////
    //  Modal Handlers //
    /////////////////////

    const handleButtonClick = () => {
        // We open Create Contract modal
        setShowModal(true)
    }

    const handleCancel = () => {
        // We close Create Contract modal
        setShowModal(false)
    }

    //////////////////////////////////
    //  Create Collection Handlers  //
    //////////////////////////////////
    return (
        <>
            <nav
                className="p-5 flex flex-row justify-between items-top"
                style={{ color: "whitesmoke" }}
            >
                <Row>
                    <h1 className="py-4 px-4 font-bold text-4xl">Marcopolo</h1>
                </Row>
                <div className="flex flex-row items-center">
                    <Link href="/" passHref>
                        <a className="mr-4 p-6">🚀 Explore Market</a>
                    </Link>
                    <Link href={`/profile/${account}`} passHref>
                        <a className="mr-4 p-6">🖼 My Profile</a>
                    </Link>
                    <Button
                        onClick={() => handleButtonClick()}
                        style={{
                            backgroundColor: "none",
                            borderStyle: "hidden",
                            cursor: "pointer",
                            fontSize: "16px",
                            marginRight: "40px",
                            padding: 0,
                            textAlign: "left",
                            width: "auto",
                            color: "whitesmoke",
                        }}
                    >
                        🧙‍♂️ Create Collection
                    </Button>
                    {/* this style does nothing, just placeholder */}
                    <ChainsTwo style={BorderBottomOutlined} />
                    <ConnectButton moralisAuth={false} />
                </div>
            </nav>
            <CollectionModal
                showModal={showModal}
                setShowModal={setShowModal}
                handleCancel={handleCancel}
            />
        </>
    )
}

const CollectionModal = ({ showModal, handleCancel }) => {
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [collectionData, setCollectionData] = useState(null)
    const [artworkData, setArtworkData] = useState(null)
    const [ipfsImageUri, setIpfsImageUri] = useState(null)
    const [ipfsFileUri, setIpfsFileUri] = useState(null)
    const [contractCreated, setContractCreated] = useState(false)
    const [newContractDetails, setNewContractDetails] = useState({})
    const [nftMinted, setNftMinted] = useState(false)
    const [fileList, setFileList] = useState([])

    const { runContractFunction } = useWeb3Contract()

    const { chainId } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const contractFactoryAddress = chainId ? networkMapping[chainString].ContractFactory[0] : null

    ////////////////////////
    //  Create Collection //
    ////////////////////////

    async function createContract() {
        const contractDeployFee = 0.002

        // don't stop loading and close until contract is created
        setLoading(true)
        console.log("Creating Contract now...")

        const formattedDeployFee = ethers.utils
            .parseUnits(contractDeployFee.toString(), "ether")
            .toString()

        console.log("formattedDeployFee: ", formattedDeployFee)

        const contractOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "create721Contract",
            msgValue: formattedDeployFee,
            params: {
                _name: collectionData.collectionName,
                _symbol: collectionData.collectionSymbol,
                _baseURI: "https://ipfs.io/ipfs/" + ipfsFileUri, // same baseURI/Metadata for all NFTs in collection
                _maxSupply: 10,
                _royaltiesPercentage: collectionData.royaltiesPercentage,
                _royaltiesReceiver: collectionData.royaltiesReceiver,
            },
        }

        const tx = await runContractFunction({
            params: contractOptions,
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => console.log(error),
        })

        const receipt = await tx.wait(1)

        console.log("tx: ", tx)
        console.log("receipt: ", receipt)

        console.log("CONTRACT FACTORY ADDRESS: ", contractFactoryAddress)

        const filteredLogs = receipt.logs.filter((log) => log.address === contractFactoryAddress)

        const newContract = "0x" + filteredLogs[0].data.slice(90)
        console.log("NEW CONTRACT: ", newContract) // 0x04CBa5e6dE886069567fe7A907D81cB1bC30E0F1

        const creator = "0x" + filteredLogs[0].data.slice(26, 66)
        console.log("CREATOR: ", creator) // 0xD21bb23e1F754f3a282E5aFf82Ba6f58B7e15D3b

        console.log(`NEW CONTRACT ${newContract} CREATED BY ${creator}!`)

        setNewContractDetails({ creator: creator, contractAddress: newContract })
        setContractCreated(true)
        setLoading(false)

        message.success(`Contract Created at address ${newContract} by ${creator}!`)
    }

    ///////////////
    //  Mint NFT //
    ///////////////

    async function mintNFT() {
        // don't stop loading and close until contract is created
        setLoading(true)
        console.log("Minting NFT now...")

        const transactionOptions = {
            abi: contractAbi,
            contractAddress: newContractDetails.contractAddress,
            functionName: "mint",
            params: {
                _to: newContractDetails.creator,
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

        console.log(`NEW TOKEN MINTED BY ${newContractDetails.creator}!`)

        message.success(`NFT Minted - View the NFT in your profile!`)

        setNftMinted(true)
        setLoading(false)
    }

    /////////////////////////
    //  Steps Nav Handlers //
    /////////////////////////

    const handlePrev = () => {
        setCurrentStep(currentStep - 1)
    }

    const isStepDisabled = (stepNumber) => {
        if (stepNumber === 0) {
            return contractCreated // disabled if contract has been created in step 2
        } else if (stepNumber === 1) {
            return contractCreated || !collectionData // disabled if contract has been created in step 2 or if collection data is not set in step 0
        } else if (stepNumber === 2) {
            return !artworkData || !collectionData // disabled if artwork data is not set in step 1 or if collection data is not set in step 0
        }
    }

    ///////////////////////////
    //  Form Finish Handlers //
    ///////////////////////////

    const handleFinishCollection = (values) => {
        setCollectionData(values)

        setCurrentStep(1)
    }

    const handleFinishArtwork = async (values) => {
        const { artworkAttributes, artworkDescription, artworkName, uploadArtwork } = values

        setArtworkData(values)

        const artworkBlob = {
            name: artworkName,
            description: artworkDescription,
            image: "https://ipfs.io/ipfs/" + ipfsImageUri,
            attributes: artworkAttributes,
        }

        handleIpfsFileUpload(artworkBlob)

        setCurrentStep(2)
    }

    ///////////////////////
    //  IPFS Upload Blob //
    ///////////////////////

    const handleIpfsFileUpload = async (artworkBlob) => {
        const blob = new Blob([JSON.stringify(artworkBlob)], { type: "application/json" })

        try {
            const fileAdded = await client.add(blob)
            console.log("fileAdded_209: ", fileAdded)

            setIpfsFileUri(fileAdded.cid.toString())

            message.success("File uploaded to IPFS successfully!")

            console.log("ipfsFileUri_215: ", ipfsFileUri)
        } catch (error) {
            console.log("Error uploading file to IPFS: ", error)
        }
        return false
    }

    ////////////////////////
    //  IPFS Upload Image //
    ////////////////////////

    const handleIpfsImageUpload = async (file) => {
        try {
            file.status = "uploading"

            // Add updated file to fileList state
            setFileList((prevFileList) => {
                const updatedFileList = prevFileList.map((f) => {
                    if (f.uid === file.uid) {
                        return file
                    } else {
                        return f
                    }
                })
                console.log(updatedFileList)
                return updatedFileList
            })

            console.log("353: ", file, fileList)

            const fileAdded = await client.add(file)
            // console.log("fileAdded_233: ", fileAdded)
            setIpfsImageUri(fileAdded.cid)

            // Update file status to "done"
            file.status = "done"

            setFileList((prevFileList) => {
                const updatedFileList = prevFileList.map((f) => {
                    if (f.uid === file.uid) {
                        return file
                    } else {
                        return f
                    }
                })
                return updatedFileList
            })

            console.log("373: ", file, fileList)

            message.success("File uploaded to IPFS successfully!")

            console.log("NEW_fileList: ", fileList)
        } catch (error) {
            console.log("Error uploading file to IPFS: ", error)
            // Update the file upload status
            file.status = "error"

            setFileList((prevFileList) => {
                const updatedFileList = prevFileList.map((f) => {
                    if (f.uid === file.uid) {
                        return file
                    } else {
                        return f
                    }
                })
                return updatedFileList
            })
        }
    }

    ////////////
    //  Forms //
    ////////////

    const forms = [
        <CollectionForm onFinish={handleFinishCollection} initialValues={collectionData} />,
        <ArtworkForm
            onFinish={handleFinishArtwork}
            initialValues={artworkData}
            handlePrev={handlePrev}
            handleIpfsImageUpload={handleIpfsImageUpload}
            setFileList={setFileList}
            fileList={fileList}
        />,
        <FinishAndPayForm
            createContract={createContract}
            contractCreated={contractCreated}
            nftMinted={nftMinted}
            mintNFT={mintNFT}
            newContractDetails={newContractDetails}
        />,
    ]

    return (
        <div>
            <Modal
                title={`Create New Collection`}
                open={showModal}
                onCancel={contractCreated && !nftMinted ? null : handleCancel} // If contract is created but NFT not minted, don't allow user to close modal
                footer={null}
            >
                {loading ? (
                    <Spin>
                        <Steps
                            style={{ padding: "15px" }}
                            onChange={setCurrentStep}
                            current={currentStep}
                            items={[
                                { title: "Collection Details", disabled: isStepDisabled(0) },
                                { title: "Artwork Details", disabled: isStepDisabled(1) },
                                { title: "Finish", disabled: isStepDisabled(2) },
                            ]}
                        />
                        {forms[currentStep]}
                    </Spin>
                ) : (
                    <div>
                        <Steps
                            style={{ padding: "15px" }}
                            onChange={setCurrentStep}
                            current={currentStep}
                            items={[
                                { title: "Collection Details", disabled: isStepDisabled(0) },
                                { title: "Artwork Details", disabled: isStepDisabled(1) },
                                { title: "Finish", disabled: isStepDisabled(2) },
                            ]}
                        />
                        {forms[currentStep]}
                    </div>
                )}
            </Modal>
        </div>
    )
}
