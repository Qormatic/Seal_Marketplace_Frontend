// This is the template for "NFT Collection Page"

import { GET_ACTIVE_ITEMS } from "../../constants/subgraphQueries"
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplaceAbi from "../../constants/MP_NFTMarketplace.json"
import nftAuctionAbi from "../../constants/MP_NFTAuction.json"
import nftAbi from "../../constants/BasicNft.json"
import Link from "next/link"
// import Image from "next/image"
import { useEffect, useState } from "react"
import { Layout, Row, Col, Image, Typography, Card, Button, Avatar, Divider } from "antd"
const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

export default function CollectionPage({ data }) {
    return (
        <Layout>
            <Header>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ color: "#fff" }}>
                            EPI by Nikolaigritsanchuk
                        </Title>
                    </Col>
                    <Col>
                        <Button type="primary" size="large">
                            Follow
                        </Button>
                    </Col>
                </Row>
            </Header>
            <Content style={{ padding: "50px 100px" }}>
                <Row justify="center" align="middle">
                    <Col span={8}>
                        <Avatar
                            size={200}
                            src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
                        />
                        <Title level={3}>Nikolaigritsanchuk</Title>
                        <Text>Artist</Text>
                        <Text strong>
                            Crypto artist, digital artist, and 3D artist creating unique art on the
                            blockchain.
                        </Text>
                        <Button type="primary" size="large" style={{ marginTop: 20 }}>
                            Follow
                        </Button>
                    </Col>
                </Row>
                <Divider style={{ margin: "50px 0" }} />
                <Row gutter={16}>
                    <Col span={8}>
                        <Card>
                            <img
                                src="https://via.placeholder.com/300x200.png?text=Artwork+1"
                                alt="Artwork 1"
                            />
                            <Title level={4}>Artwork 1</Title>
                            <Text>by Nikolaigritsanchuk</Text>
                            <Text type="secondary">Created 1 day ago</Text>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <img
                                src="https://via.placeholder.com/300x200.png?text=Artwork+2"
                                alt="Artwork 2"
                            />
                            <Title level={4}>Artwork 2</Title>
                            <Text>by Nikolaigritsanchuk</Text>
                            <Text type="secondary">Created 2 days ago</Text>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <img
                                src="https://via.placeholder.com/300x200.png?text=Artwork+3"
                                alt="Artwork 3"
                            />
                            <Title level={4}>Artwork 3</Title>
                            <Text>by Nikolaigritsanchuk</Text>
                            <Text type="secondary">Created 3 days ago</Text>
                        </Card>
                    </Col>
                </Row>
            </Content>
            <Footer style={{ textAlign: "center" }}>
                Created with Ant Design and Next.js ©2023 Created by Nikolaigritsanchuk
            </Footer>
        </Layout>
    )
}

export async function getStaticProps({ params }) {
    const { collectionAddress } = params || {}

    // "context" contains the parameters used to create the current route user is on
    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const { data } = await client.query({
        query: GET_ACTIVE_ITEMS,
    })

    const allItems = [...data.activeFixedPriceItems, ...data.activeAuctionItems]

    const filteredItems = allItems.filter((item) => item.nftAddress === collectionAddress)

    return { props: { data: filteredItems } }
}

export async function getStaticPaths() {
    const client = new ApolloClient({
        cache: new InMemoryCache(),
        uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    })

    const { data } = await client.query({
        query: GET_ACTIVE_ITEMS,
    })

    const allItems = [...data.activeFixedPriceItems, ...data.activeAuctionItems]

    const uniqueItems = [...new Set(allItems.map(({ nftAddress }) => nftAddress))]

    console.log(uniqueItems)

    const allPaths = uniqueItems.map((item) => {
        return {
            params: {
                collectionAddress: item,
            },
        }
    })

    return {
        paths: allPaths, // tell app which routes to create in build time
        fallback: false, // if user puts in an incorrect route; 404 will be returned
    }
}
