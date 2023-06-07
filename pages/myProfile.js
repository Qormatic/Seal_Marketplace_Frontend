// This is the My Collections page; listing the NFT a user owns

// import Head from "next/head" // using HEad allows us to set Metadata for a page which improves SEO
import styles from "@/styles/Home.module.css"
import { useMoralis, useWeb3Contract, useNFTBalances } from "react-moralis"
import { networkMapping, nftMarketplaceAbi, nftAuctionAbi } from "@/constants"
import MyNFT_Box from "@/components/MyNFT_Box"
import { useEffect, useState } from "react"
import { NftFilters, Alchemy, Network } from "alchemy-sdk"
import { Typography, Divider } from "antd"
const { Title } = Typography

export default function Profile() {
    const [userNFTs, setUserNFTs] = useState({})
    const [loading, setLoading] = useState(true)
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    const auctionAddress = chainId ? networkMapping[chainString].NFTAuction[0] : null
    console.log(auctionAddress)

    console.log(chainId)

    const networkConfig = {
        chainId: chainId === "0x13881" ? Network.MATIC_MUMBAI : Network.ETH_GOERLI,
    }

    const alchemy = new Alchemy({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        network: Network.MATIC_MUMBAI,
    })

    useEffect(() => {
        if (account) {
            myNFTs()
        }
    }, [account])

    async function myNFTs() {
        setLoading(true)

        // Get all user NFTs
        const nfts = await alchemy.nft.getNftsForOwner(account, {
            // excludeFilters: [NftFilters.SPAM],
        })

        setUserNFTs(nfts)
        setLoading(false)
    }

    console.log("userNFTs: ", userNFTs)

    return (
        <div style={{ padding: "50px" }}>
            <Title level={2}>My NFTs</Title>
            <div>
                <Divider style={{ width: "100%" }} />
            </div>
            {isWeb3Enabled && chainId ? (
                loading || !userNFTs ? (
                    <div>Loading...</div>
                ) : (
                    userNFTs.ownedNfts.map((token) => {
                        const { contract, rawMetadata, tokenId } = token
                        return marketplaceAddress ? (
                            <MyNFT_Box
                                key={`${contract.address}${tokenId}`} // unique key required for each element in mapping; we create one here
                                collectionName={contract.name}
                                nftAddress={contract.address}
                                tokenId={tokenId}
                                marketplaceAddress={marketplaceAddress}
                                auctionAddress={auctionAddress}
                            />
                        ) : (
                            <div>Network error, please switch to a supported network. </div>
                        )
                    })
                )
            ) : (
                <div>Web3 Currently Not Enabled</div>
            )}
        </div>
    )
}
