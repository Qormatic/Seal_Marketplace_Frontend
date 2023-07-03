import { ethers } from "ethers"
const mumbaiChain = "80001"
import { networkMapping } from "@/constants"
import contractFactoryAbi from "@/constants/Seal_ContractFactory.json"
import contractAbi from "@/constants/Seal_721_Contract.json"
const contractFactoryAddress = mumbaiChain ? networkMapping[mumbaiChain].ContractFactory[0] : null

export const checkSealContract = async (collectionAddress) => {
    try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL)
        const contractFactory = new ethers.Contract(
            contractFactoryAddress,
            contractFactoryAbi,
            provider
        )

        // Check for contractAddress in factory contract
        const deployerAddress = await contractFactory.s_deployedContracts(collectionAddress)
        let remainingSupply = null

        // if deployerAddress returns zero address it's not Seal
        if (deployerAddress !== "0x0000000000000000000000000000000000000000") {
            const collectionContract = new ethers.Contract(
                collectionAddress,
                contractAbi,
                provider
            )

            const maxSupply = await collectionContract.s_maxSupply() // total amount allowed to be minted
            const totalSupply = await collectionContract.totalSupply() // current amount that has been minted

            const difference = maxSupply.sub(totalSupply)
            let bigNum = ethers.BigNumber.from(difference)
            remainingSupply = bigNum.toString()
        }

        return {
            contractDeployer:
                deployerAddress === "0x0000000000000000000000000000000000000000"
                    ? false
                    : deployerAddress,
            remainingSupply: remainingSupply,
        }
    } catch (error) {
        console.log("error: ", error)
        // Rethrow the error after logging it
        throw error
    }
}
