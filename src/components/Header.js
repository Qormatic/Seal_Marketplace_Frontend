import { ConnectButton } from "web3uikit"
import { Chains, ChainsTwo } from "@/components/Chains/Chains"
import { CollectionForm, ArtworkForm, FinishAndPayForm } from "@/components/Forms"
import SellModal from "@/components/SellNFT_Modal"
import Link from "next/link"
import { useRouter } from "next/router"
import { ethers } from "ethers"
import nftMarketplaceAbi from "@/constants/Seal_NFTMarketplace.json"
import contractAbi from "@/constants/Seal_721_Contract.json"
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
import CryptoJS from "crypto-js"

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

//////////////////////////////////////////
//  Header for all pages except profile //
//////////////////////////////////////////

export function Header() {
    const router = useRouter()
    const { account } = useMoralis()
    const [showCollectionModal, setShowCollectionModal] = useState(false)
    const [showSellModal, setShowSellModal] = useState(false)

    ////////////////////////////////
    //  Collection Modal Handlers //
    ////////////////////////////////

    const handleOpenCreateModal = () => {
        // We open Create Contract modal
        setShowCollectionModal(true)
    }

    const handleCloseCreateModal = () => {
        // We close Create Contract modal
        setShowCollectionModal(false)
        console.log("showCollectionModal: ", showCollectionModal)
    }

    //////////////////////////
    //  Sell Modal Handlers //
    //////////////////////////

    const handleOpenSellModal = () => {
        // We open Create Sell modal
        setShowSellModal(true)
    }

    const handleCancelSellModal = () => {
        // We close Create Sell modal
        setShowSellModal(false)
    }

    ///////////////////////////////////
    //  Check if user has a profile  //
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
                        onClick={() => handleOpenCreateModal()}
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
                    <Button
                        onClick={() => handleOpenSellModal()}
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
                        🤑 Sell NFT
                    </Button>
                    <Chains />
                    <ConnectButton moralisAuth={false} />
                </div>
            </nav>
            <CollectionModal
                showCollectionModal={showCollectionModal}
                handleCloseCreateModal={handleCloseCreateModal}
            />
            <SellModal
                showSellModal={showSellModal}
                handleCancelSellModal={handleCancelSellModal}
            />
        </>
    )
}

//////////////////////////////
//  Header for profile page //
//////////////////////////////

export function ProfileHeader() {
    const { account } = useMoralis()
    const [showCollectionModal, setShowCollectionModal] = useState(false)
    const [showSellModal, setShowSellModal] = useState(false)

    /////////////////////
    //  Modal Handlers //
    /////////////////////

    const handleOpenCreateModal = () => {
        // We open Create Contract modal
        setShowCollectionModal(true)
    }

    const handleCloseCreateModal = () => {
        // We close Create Contract modal
        setShowCollectionModal(false)
        console.log("showCollectionModal: ", showCollectionModal)
    }

    //////////////////////////
    //  Sell Modal Handlers //
    //////////////////////////

    const handleOpenSellModal = () => {
        // We open Create Sell modal
        setShowSellModal(true)
    }

    const handleCancelSellModal = () => {
        // We close Create Sell modal
        setShowSellModal(false)
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
                        onClick={() => handleOpenCreateModal()}
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
                    <Button
                        onClick={() => handleOpenSellModal()}
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
                        🤑 Sell NFT
                    </Button>
                    {/* this style does nothing, just placeholder */}
                    <ChainsTwo style={BorderBottomOutlined} />
                    <ConnectButton moralisAuth={false} />
                </div>
            </nav>
            <CollectionModal
                showCollectionModal={showCollectionModal}
                handleCloseCreateModal={handleCloseCreateModal}
            />
            <SellModal
                showSellModal={showSellModal}
                handleCancelSellModal={handleCancelSellModal}
            />
        </>
    )
}

///////////////////////////////
//  Create Collection Modal  //
///////////////////////////////

const CollectionModal = ({ showCollectionModal, handleCloseCreateModal }) => {
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [collectionData, setCollectionData] = useState({
        collectionName: null,
        collectionSymbol: null,
        supply: 0,
        royaltiesPercentage: 0,
        royaltiesReceiver: null,
        privateView: "false",
    })
    const [artworkData, setArtworkData] = useState({
        uploadMetadata: [],
        uploadArtwork: [],
    })
    const [contractCreated, setContractCreated] = useState(false)
    const [newContractDetails, setNewContractDetails] = useState({})
    const [nftMinted, setNftMinted] = useState(false)
    const [baseUri, setBaseUri] = useState(null)

    const { runContractFunction } = useWeb3Contract()

    // const { chainId } = useMoralis()
    const chainId = 80001
    console.log("chainId", chainId)
    const chainString = chainId ? parseInt(chainId).toString() : null
    console.log("chainString", chainString)
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const contractFactoryAddress = chainId ? networkMapping[chainString].ContractFactory[0] : null

    ////////////////////////
    //  Create Collection //
    ////////////////////////

    async function createContract() {
        const contractDeployFee = 0.002

        // don't stop loading until contract is created
        setLoading(true)
        console.log("Creating Contract now...")

        const formattedDeployFee = ethers.utils
            .parseUnits(contractDeployFee.toString(), "ether")
            .toString()

        console.log("formattedDeployFee: ", formattedDeployFee)

        const functionParameters = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "create721Contract",
            msgValue: formattedDeployFee,
            params: {
                _name: collectionData.collectionName,
                _symbol: collectionData.collectionSymbol,
                _baseURI: baseUri, // same baseURI/Metadata for all NFTs in collection
                _maxSupply: collectionData.supply,
                _royaltiesPercentage: collectionData.royaltiesPercentage,
                _royaltiesReceiver: collectionData.royaltiesReceiver,
                _private: collectionData.privateView === "true", // This converts "true" string to true boolean and "false" string to false boolean
            },
        }

        const tx = await runContractFunction({
            params: functionParameters,
            // console.log any error returned. You should include this for any runContractFunction
            onError: (error) => console.log(error),
        })

        const receipt = await tx.wait(1)

        console.log("tx: ", tx)
        console.log("receipt: ", receipt)
        console.log("CONTRACT FACTORY ADDRESS: ", contractFactoryAddress)

        // filter log entries to leave only those where the log.address matches the contractFactory; i.e: only events emitted by contractFactory
        const filteredLogs = receipt.logs.filter((log) => log.address === contractFactoryAddress)

        // `topics` is an array of bytes32 strings. Each indexed parameter occupies one slot in the array.
        // `topic[0]` is the hashed signature of the event. `topic[1]` is the first indexed parameter, `topic[2]` is the second indexed parameter
        const creator = "0x" + filteredLogs[0].topics[1].slice(-40) // use ethers to change to address from 0x00000000000000000000000070bca05c07991398b96207516f3a9d0817eaff51
        const newContract = "0x" + filteredLogs[0].topics[2].slice(-40)

        console.log(`NEW CONTRACT ${newContract} CREATED BY ${creator}!`)

        setNewContractDetails({ creator: creator, contractAddress: newContract })
        setContractCreated(true)
        setLoading(false)

        message.success(`Contract Created at address ${newContract} by ${creator}!`)
    }

    ///////////////
    //  Mint NFT //
    ///////////////

    async function mintNFT(_mintAmount) {
        // don't stop loading until nft minted
        setLoading(true)
        console.log("Minting NFT now...")

        const transactionOptions = {
            abi: contractAbi,
            contractAddress: newContractDetails.contractAddress,
            functionName: "mint",
            params: {
                mintAmount: _mintAmount,
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
            return baseUri // disabled if baseUri available
        } else if (stepNumber === 1) {
            return baseUri // disabled if baseUri available
        } else if (stepNumber === 2) {
            return !baseUri // disabled if IPFS baseUri not available meaning step 1 & 2 are still to be completed
        }
    }

    ////////////
    //  Forms //
    ////////////

    const forms = [
        <CollectionForm
            setCurrentStep={setCurrentStep}
            setCollectionData={setCollectionData}
            initialValues={collectionData} // this tracks users entries if they close modal
        />,
        <ArtworkForm
            handlePrev={handlePrev}
            setBaseUri={setBaseUri}
            setLoading={setLoading}
            setCurrentStep={setCurrentStep}
            encryptImage={collectionData.privateView}
            setArtworkData={setArtworkData}
            initialValues={artworkData} // this tracks users entries if they close modal
        />,
        <FinishAndPayForm
            createContract={createContract}
            contractCreated={contractCreated}
            nftMinted={nftMinted}
            mintNFT={mintNFT}
            newContractDetails={newContractDetails}
            handleCloseCreateModal={handleCloseCreateModal}
        />,
    ]

    const stepsItems = [
        { title: "Collection Details", disabled: isStepDisabled(0) },
        { title: "Artwork Details", disabled: isStepDisabled(1) },
        { title: "Finish", disabled: isStepDisabled(2) },
    ]

    return (
        <div>
            <Modal
                title="Create New Collection"
                open={showCollectionModal}
                onCancel={handleCloseCreateModal}
                footer={null}
            >
                {loading ? (
                    <Spin>
                        <Steps
                            style={{ padding: "15px" }}
                            onChange={setCurrentStep}
                            current={currentStep}
                            items={stepsItems}
                        />
                        {forms[currentStep]}
                    </Spin>
                ) : (
                    <>
                        <Steps
                            style={{ padding: "15px" }}
                            onChange={setCurrentStep}
                            current={currentStep}
                            items={stepsItems}
                        />
                        {forms[currentStep]}
                    </>
                )}
            </Modal>
        </div>
    )
}
