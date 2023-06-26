// import styles from "../styles/Browse.module.css"
import { useMoralis } from "react-moralis"
import Collection_Box from "@/components/Collection_Box"
import { networkMapping } from "@/constants" // when we reference a folder, we will pick up module.exports from our index.js
import { Row, Col, Typography, Spin, Tooltip } from "antd"
import { useEffect, useState } from "react"

const { Title } = Typography

export default function CollectionList({ userMPCollections }) {
    const { chainId, isWeb3Enabled, account } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const auctionAddress = chainId ? networkMapping[chainString].NFTAuction[0] : null

    // console.log("walletNftsLIST: ", walletNfts)
    console.log("marketplaceAddress: ", marketplaceAddress)
    console.log("auctionAddress: ", auctionAddress)
    console.log("userMPCollections_CollectionList: ", userMPCollections)

    return (
        <div className="container mx-auto">
            <Row gutter={[16, 16]}>
                {isWeb3Enabled && chainId ? (
                    userMPCollections ? (
                        userMPCollections.map(({ address, name, symbol }) => {
                            return marketplaceAddress ? (
                                <Col key={address} xs={24} sm={12} md={8} lg={6} xl={5}>
                                    <Collection_Box
                                        key={address} // unique key required for each element in mapping; we create one here
                                        address={address}
                                        name={name}
                                        symbol={symbol}
                                    />
                                </Col>
                            ) : (
                                <Col key={address} xs={24} sm={12} md={8} lg={6} xl={5}>
                                    <Tooltip title="Loading metadata for this collection; please reload the page in a few moments">
                                        <Spin>
                                            <Collection_Box
                                                key={address} // unique key required for each element in mapping; we create one here
                                                address={address}
                                                name={name}
                                                symbol={symbol}
                                            />
                                        </Spin>
                                    </Tooltip>
                                </Col>
                            )
                        })
                    ) : (
                        <Title level={2}>Loading...</Title>
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
