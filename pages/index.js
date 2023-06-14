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
    const [showFixedPrice, setShowFixedPrice] = useState(false)
    const [showAuction, setShowAuction] = useState(false)
    const [showAllActive, setShowAllActive] = useState(false)

    //////////////////////
    //  Filter Buttons  //
    //////////////////////

    const handleFixedPriceFilter = () => {
        setShowFixedPrice(true)
        setShowAllActive(false)
        setShowAuction(false)
    }

    const handleAuctionFilter = () => {
        setShowAuction(true)
        setShowAllActive(false)
        setShowFixedPrice(false)
    }

    const handleShowAllActive = () => {
        setShowAllActive(true)
        setShowAuction(false)
        setShowFixedPrice(false)
    }

    const allNfts = [...listedNfts.activeFixedPriceItems, ...listedNfts.activeAuctionItems]

    console.log("allNfts: ", allNfts)

    const filteredNfts = showFixedPrice
        ? listedNfts.activeFixedPriceItems
        : showAuction
        ? listedNfts.activeAuctionItems
        : allNfts

    console.log("filteredNfts: ", filteredNfts)

    return (
        <div style={{ padding: "50px" }}>
            <Row>
                <Title level={2}>Browse</Title>
            </Row>
            <div>
                <Divider style={{ width: "100%" }} />
            </div>
            <NFT_OnSaleFilter
                fixedNftsLength={listedNfts.activeFixedPriceItems.length}
                auctionNftsLength={listedNfts.activeAuctionItems.length}
                handleFixedPriceFilter={handleFixedPriceFilter}
                handleAuctionFilter={handleAuctionFilter}
                handleShowAllActive={handleShowAllActive}
                showFixedPrice={showFixedPrice}
                showAuction={showAuction}
                showAllActive={showAllActive}
                allNftsLength={allNfts.length}
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
