const Moralis = require("moralis").default
const { EvmChain } = require("@moralisweb3/common-evm-utils")

const runApp = async () => {
    await Moralis.start({
        apiKey: "xsGa8nGvXmuJOU8VKSsIYBXIJWIGQ4oPQ0dQypdy1iJLYeaKopyLpvQARgzd1riN",
        // ...and any other configuration
    })

    const address = "0xb68c38d85F7fd44aF18da28d81a2BEEAcbbba4C3"

    const chain = "0x5"

    const response = await Moralis.EvmApi.nft.getWalletNFTCollections({
        address,
        chain,
    })

    console.log(response.toJSON())
}

runApp()

// https://api.opensea.io/api/v1/assets?owner=${address}
