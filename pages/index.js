// Browse page lists all Active Items

// import styles from "../styles/Browse.module.css"
import { useMoralis } from "react-moralis"
import { useState } from "react"

import NFTList from "@/components/NFTList"
import { NFT_OnSaleFilter } from "@/components/Filter"
import { networkMapping } from "@/constants" // when we reference a folder, we will pick up module.exports from our index.js
import { GET_ACTIVE_ITEMS } from "@/constants/subgraphQueries"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
import { Space, Button, Divider, Row, Badge, Typography } from "antd"

const { Title } = Typography

export default function Browse({ listedNfts }) {
    const [filterState, setFilterState] = useState("all")

    const allNfts = [...listedNfts.activeFixedPriceItems, ...listedNfts.activeAuctionItems]

    const filteredNfts =
        filterState === "fixedPrice"
            ? listedNfts.activeFixedPriceItems
            : filterState === "auction"
            ? listedNfts.activeAuctionItems
            : allNfts

    return (
        <div style={{ padding: "50px" }}>
            <Row>
                <Title level={2}>Browse</Title>
            </Row>
            <div>
                <Divider style={{ width: "100%" }} />
            </div>
            <NFT_OnSaleFilter
                allNftsLength={allNfts.length}
                fixedNftsLength={listedNfts.activeFixedPriceItems.length}
                auctionNftsLength={listedNfts.activeAuctionItems.length}
                handleFilterChange={setFilterState}
                filterState={filterState}
                handleFixedPriceFilter={() => setFilterState("fixedPrice")}
                handleAuctionFilter={() => setFilterState("auction")}
                handleShowAllActive={() => setFilterState("all")}
                showFixedPrice={filterState === "fixedPrice"}
                showAuction={filterState === "auction"}
                showAllActive={filterState === "all"}
            />
            <div>
                <NFTList showOnSale={true} NFTListData={filteredNfts} />
            </div>
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
