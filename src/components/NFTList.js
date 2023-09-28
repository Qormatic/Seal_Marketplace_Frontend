// import styles from "../styles/Browse.module.css"
import { useMoralis } from "react-moralis"
import MktNFT_Box from "@/components/MarketNFT_Box"
import MyNFT_Box from "@/components/MyNFT_Box"
import { networkMapping } from "@/constants" // when we reference a folder, we will pick up module.exports from our index.js
import { Row, Col, Typography } from "antd"

const { Title } = Typography

export default function NFTList({ NFTListData, showOnSale }) {
    // const { chainId, isWeb3Enabled, account } = useMoralis()
    const { isWeb3Enabled, account } = useMoralis()

    const chainId = 80001
    console.log("chainId", chainId)
    const chainString = chainId ? parseInt(chainId).toString() : null
    // const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const auctionAddress = chainId ? networkMapping[chainString].NFTAuction[0] : null

    // console.log("walletNftsLIST: ", walletNfts)
    console.log("marketplaceAddress: ", marketplaceAddress)
    console.log("auctionAddress: ", auctionAddress)
    console.log("NFTListData: ", NFTListData)

    return (
        <div className="container mx-auto">
            <Row gutter={[16, 16]}>
                {isWeb3Enabled && chainId ? (
                    NFTListData ? (
                        showOnSale ? (
                            NFTListData.map(
                                ({
                                    price,
                                    nftAddress,
                                    tokenId,
                                    seller,
                                    highestBid,
                                    reservePrice,
                                }) => {
                                    return marketplaceAddress ? (
                                        <Col
                                            key={`${nftAddress}${tokenId}`}
                                            xs={24}
                                            sm={12}
                                            md={8}
                                            lg={6}
                                            xl={5}
                                        >
                                            <MktNFT_Box
                                                key={`${nftAddress}${tokenId}`} // unique key required for each element in mapping; we create one here
                                                price={price || highestBid || reservePrice}
                                                nftAddress={nftAddress}
                                                tokenId={tokenId}
                                                marketplaceAddress={marketplaceAddress}
                                                seller={seller}
                                                saleType={
                                                    price
                                                        ? "Buy Now"
                                                        : reservePrice
                                                        ? "Reserve"
                                                        : "Latest Bid"
                                                }
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
                                                Network error, please switch to a supported
                                                network.{" "}
                                            </div>
                                        </Col>
                                    )
                                }
                            )
                        ) : (
                            NFTListData.map(
                                ({
                                    contractName,
                                    contractSymbol,
                                    imageUri,
                                    description,
                                    name,
                                    nftAddress,
                                    tokenId,
                                    tokenType,
                                    tokenUri,
                                }) => {
                                    return marketplaceAddress ? (
                                        <Col
                                            key={`${nftAddress}${tokenId}`}
                                            xs={24}
                                            sm={12}
                                            md={8}
                                            lg={6}
                                            xl={5}
                                        >
                                            <MyNFT_Box
                                                key={`${nftAddress}${tokenId}`} // unique key required for each element in mapping; we create one here
                                                collectionName={contractName}
                                                name={name}
                                                description={description}
                                                nftAddress={nftAddress}
                                                imageUri={imageUri}
                                                tokenUri={tokenUri}
                                                tokenId={tokenId}
                                                marketplaceAddress={marketplaceAddress}
                                                auctionAddress={auctionAddress}
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
                                                Network error, please switch to a supported
                                                network.{" "}
                                            </div>
                                        </Col>
                                    )
                                }
                            )
                        )
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
