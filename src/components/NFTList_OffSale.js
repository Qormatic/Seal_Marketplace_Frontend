// import styles from "../styles/Browse.module.css"
import { useMoralis } from "react-moralis"
import OffSale_Box from "@/components/OffSale_Box"
import placeholder from "../../public/images/placeholder.png"
import { networkMapping } from "@/constants" // when we reference a folder, we will pick up module.exports from our index.js
import { Row, Col, Typography } from "antd"

const { Title } = Typography

export default function NFTList_OffSale({ NFTListData }) {
    const { chainId, isWeb3Enabled, account } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null

    return (
        <div className="container mx-auto">
            <Row gutter={[16, 16]}>
                {isWeb3Enabled && chainId ? (
                    NFTListData ? (
                        NFTListData.map(({ nftAddress, tokenId, imageUri }) => {
                            return marketplaceAddress ? (
                                <Col
                                    key={`${nftAddress}${tokenId}`}
                                    xs={24}
                                    sm={12}
                                    md={8}
                                    lg={6}
                                    xl={5}
                                >
                                    <OffSale_Box
                                        key={`${nftAddress}${tokenId}`} // unique key required for each element in mapping; we create one here
                                        nftAddress={nftAddress}
                                        tokenId={tokenId}
                                        imageUri={imageUri || placeholder}
                                    />
                                </Col>
                            ) : (
                                <Col
                                    key={`${nftAddress}${tokenId}`}
                                    xs={24}
                                    sm={12}
                                    md={8}
                                    lg={6}
                                    xl={5}
                                >
                                    <div>
                                        Network error, please switch to a supported network.{" "}
                                    </div>
                                </Col>
                            )
                        })
                    ) : (
                        <Title level={2}>Nothing to see here...</Title>
                    )
                ) : (
                    <Col xs={24} sm={12} md={8} lg={6} xl={5}>
                        <div>Web3 Currently Not Enabled</div>
                    </Col>
                )}
            </Row>
        </div>
    )
}
