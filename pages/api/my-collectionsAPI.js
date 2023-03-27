// The API response will display data at "http://localhost:3000/api/my-CollectionsAPI"

import { Alchemy, Network } from "alchemy-sdk"

const config = {
    apiKey: process.env.NEXT_ALCHEMY_API_KEY,
    network: Network.ETH_GOERLI, // "eth-goerli"
}

const address = "0xb68c38d85f7fd44af18da28d81a2beeacbbba4c3"
const alchemy = new Alchemy(config)

export default async function myNFTs(req, res) {
    try {
        // Get all NFTs
        const response = await alchemy.nft.getNftsForOwner(address)

        //         // // Print NFTs
        //         // const tokenURIs = nfts.ownedNfts.map(({ tokenUri }) => tokenUri)
        //         // console.log(tokenURIs)

        //         // // Parse output
        //         // const numNfts = nfts["totalCount"]
        //         // const nftList = nfts["ownedNfts"]

        //         // console.log(`Total NFTs owned by ${address}: ${numNfts} \n`)

        //         // let i = 1

        //         // nftList.forEach((nft) => {
        //         //     console.log(`${i}. ${nft.title}`)
        //         //     i++
        //         // })

        res.status(200).json(response)
        return response
    } catch (error) {
        console.log(error)
    }
}

// export default async function myNFTs() {
//     // Get all NFTs
//     const response = await alchemy.nft.getNftsForOwner(address)

//     // // Print NFTs
//     // const tokenURIs = nfts.ownedNfts.map(({ tokenUri }) => tokenUri)
//     // console.log(tokenURIs)

//     // // Parse output
//     // const numNfts = nfts["totalCount"]
//     // const nftList = nfts["ownedNfts"]

//     // console.log(`Total NFTs owned by ${address}: ${numNfts} \n`)

//     // let i = 1

//     // nftList.forEach((nft) => {
//     //     console.log(`${i}. ${nft.title}`)
//     //     i++s
//     // })

//     return response
//     console.log(response)
// }
