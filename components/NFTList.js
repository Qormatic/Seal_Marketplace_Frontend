// import styles from "../styles/Browse.module.css"
import { useMoralis } from "react-moralis"
import { useState } from "react"
import NFTBox from "../components/MarketNFT_Box"
import { Button, Space } from "antd"
import { networkMapping } from "../constants" // when we reference a folder, we will pick up module.exports from our index.js

// export async function getStaticPaths(){     ---> to build dynamic NFT pages, we need both getStaticPaths & getStaticProps in this page component
//                                             ---> getStaticPaths is when we don't know how may pages we ahev, so we build dynamically
// }                                           ---> getStaticPaths tells Next how many html pages needed; getStaticProps tells it what data to use in their building

// export async function getStaticProps(){

// }

export default function NFTList({ listedNfts }) {
    const { chainId, isWeb3Enabled } = useMoralis()
    const [showFixedPrice, setShowFixedPrice] = useState(false)
    const [showAuction, setShowAuction] = useState(false)
    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null

    const handleFixedPriceFilter = () => {
        setShowFixedPrice(true)
        setShowAuction(false)
    }

    const handleAuctionFilter = () => {
        setShowFixedPrice(false)
        setShowAuction(true)
    }

    const handleShowAllItems = () => {
        setShowAuction(false)
        setShowFixedPrice(false)
    }

    const filteredNfts = showFixedPrice
        ? listedNfts.activeFixedPriceItems
        : showAuction
        ? listedNfts.activeAuctionItems
        : [...listedNfts.activeFixedPriceItems, ...listedNfts.activeAuctionItems]

    const header = showFixedPrice ? "Fixed-price" : showAuction ? "For Auction" : "All"
    const saleType = showFixedPrice ? "Fixed-price" : showAuction ? "Auction" : "All"

    return (
        <div>
            <div>
                <Space>
                    <Button colour="grey" shape="round" onClick={handleShowAllItems}>
                        All Items
                    </Button>
                    <Button shape="round" onClick={handleFixedPriceFilter}>
                        Fixed-price
                    </Button>
                    <Button shape="round" onClick={handleAuctionFilter}>
                        For Auction
                    </Button>
                </Space>
            </div>
            <div className="container mx-auto">
                <h1 className="py-4 px-4 font-bold text-2xl">{header}</h1>
                <div className="flex flex-wrap">
                    {isWeb3Enabled && chainId ? (
                        // loading || !listedNfts ? (
                        !listedNfts ? (
                            <div>Loading...</div>
                        ) : (
                            filteredNfts.map(
                                ({ price, nftAddress, tokenId, seller, highestBid }) => {
                                    return marketplaceAddress ? (
                                        <NFTBox
                                            key={`${nftAddress}${tokenId}`} // unique key required for each element in mapping; we create one here
                                            price={price || highestBid}
                                            nftAddress={nftAddress}
                                            tokenId={tokenId}
                                            marketplaceAddress={marketplaceAddress}
                                            seller={seller}
                                            saleType={price ? "Fixed-Price" : "Auction"}
                                            // reservePrice={reservePrice}
                                            // startTime={startTime}
                                            // endTime={endTime}
                                        />
                                    ) : (
                                        <div>
                                            Network error, please switch to a supported network.{" "}
                                        </div>
                                    )
                                }
                            )
                        )
                    ) : (
                        <div>Web3 Currently Not Enabled</div>
                    )}
                </div>
            </div>
        </div>
    )
}
