// Browse page lists all Active Items

// import styles from "../styles/Browse.module.css"
import { useMoralis } from "react-moralis"
import NFTBox from "../components/MarketNFT_Box"
import NFTList from "../components/NFTList"
import { networkMapping } from "../constants" // when we reference a folder, we will pick up module.exports from our index.js
import { GET_ACTIVE_ITEMS } from "../constants/subgraphQueries"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"

// export async function getStaticPaths(){     ---> to build dynamic NFT pages, we need both getStaticPaths & getStaticProps in this page component
//                                             ---> getStaticPaths is when we don't know how may pages we ahev, so we build dynamically
// }                                           ---> getStaticPathstells Next how many html pages needed; getStaticProps tells it what data to use in their building

// export async function getStaticProps(){

// }

export default function Browse({ listedNfts }) {
    const { chainId, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const marketplaceAddress = chainId ? networkMapping[chainString].NFTMarketplace[0] : null
    // console.log("MARKETPLACE: ", marketplaceAddress)

    // const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS)
    // console.log(listedNfts)

    return (
        <div>
            <NFTList listedNfts={listedNfts} />
        </div>
    )
}

export const getStaticProps = async () => {
    // can't use the <apolloProvider> set up in _app.js here as it's only available to components. getStaticProps works on the server not client
    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const { data } = await client.query({
        query: GET_ACTIVE_ITEMS,
    })

    return {
        props: {
            listedNfts: data, // listedNfts returned as props to Browse function above
        },
    }
}
