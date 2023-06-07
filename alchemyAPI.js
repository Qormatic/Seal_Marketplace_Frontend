const { Alchemy, Network } = require("alchemy-sdk")

const config = {
    apiKey: "SAaDwTXrluGLiTyVmCYcdu4poxdxBHAa",
    network: Network.ETH_GOERLI, // "eth-goerli"
}

const alchemy = new Alchemy(config)

const main = async () => {
    // Get all NFTs
    const nfts = await alchemy.nft.getNftsForOwner("0xb68c38d85F7fd44aF18da28d81a2BEEAcbbba4C3")
    // Print NFTs
    const tokenURIs = nfts.ownedNfts.map(({ tokenUri }) => tokenUri)
    console.log(tokenURIs)

    // Parse output
    const numNfts = nfts["totalCount"]
    const nftList = nfts["ownedNfts"]

    console.log(
        `Total NFTs owned by ${"0xb68c38d85F7fd44aF18da28d81a2BEEAcbbba4C3"}: ${numNfts} \n`
    )

    console.log()

    let i = 1

    nftList.forEach((nft) => {
        console.log(`${i}. ${nft.title}`)
        i++
    })
}

const runMain = async () => {
    try {
        await main()
        process.exit(0)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

runMain()
