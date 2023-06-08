import { Space, Button, Divider, Badge } from "antd"

// Filters between on sale/not on sale NFTs
export function NFT_WalletFilter({ handleShowOnSaleItems, showOnSale, showSellButton }) {
    const OnSaleItemsButtonStyle = {
        background: showOnSale ? "black" : "white",
        color: showOnSale ? "white" : "black",
        marginLeft: "5px",
    }

    const walletItemsButtonStyle = {
        borderRadius: "20px",
        background: !showOnSale ? "black" : "white",
        color: !showOnSale ? "white" : "black",
    }

    return (
        <div>
            {showSellButton ? (
                <Space style={{ marginBottom: "10px", background: "white" }}>
                    <Button
                        style={OnSaleItemsButtonStyle}
                        shape="round"
                        onClick={() => handleShowOnSaleItems()}
                    >
                        On Sale NFTs{" "}
                    </Button>
                    <Button
                        style={walletItemsButtonStyle}
                        shape="round"
                        onClick={() => handleShowOnSaleItems()}
                    >
                        Sell NFTs{" "}
                    </Button>
                </Space>
            ) : (
                <Space style={{ marginBottom: "10px", background: "white" }}>
                    <Button
                        style={OnSaleItemsButtonStyle}
                        shape="round"
                        onClick={() => handleShowOnSaleItems()}
                    >
                        On Sale NFTs{" "}
                    </Button>
                </Space>
            )}
        </div>
    )
}

// Further filters those NFTs that are ON sale
export function NFT_OnSaleFilter({
    handleFixedPriceFilter,
    handleAuctionFilter,
    handleShowAllItems,
    showFixedPrice,
    showAuction,
    showAllActive,
    allNftsLength,
    fixedNftsLength,
    auctionNftsLength,
}) {
    const allItemsButtonStyle = {
        background: showAllActive ? "black" : "white",
        color: showAllActive ? "white" : "black",
        marginLeft: "5px",
    }

    const allItemsBadgeStyle = {
        background: showAllActive ? "white" : "black",
        color: showAllActive ? "black" : "white",
        marginLeft: "5px",
    }

    const fixedPriceButtonStyle = {
        borderRadius: "20px",
        background: showFixedPrice ? "black" : "white",
        color: showFixedPrice ? "white" : "black",
    }

    const fixedPriceBadgeStyle = {
        background: showFixedPrice ? "white" : "black",
        color: showFixedPrice ? "black" : "white",
        marginLeft: "5px",
    }

    const auctionButtonStyle = {
        borderRadius: "20px",
        background: showAuction ? "black" : "white",
        color: showAuction ? "white" : "black",
    }

    const auctionBadgeStyle = {
        background: showAuction ? "white" : "black",
        color: showAuction ? "black" : "white",
        marginLeft: "5px",
    }

    return (
        <div>
            <Space style={{ marginBottom: "10px", background: "white" }}>
                <Button
                    style={allItemsButtonStyle}
                    shape="round"
                    onClick={() => handleShowAllItems()}
                >
                    All Items{" "}
                    <Badge style={allItemsBadgeStyle} count={allNftsLength} overflowCount={999} />
                </Button>
                <Button
                    style={fixedPriceButtonStyle}
                    shape="round"
                    onClick={() => handleFixedPriceFilter()}
                >
                    Fixed-price{" "}
                    <Badge
                        style={fixedPriceBadgeStyle}
                        count={fixedNftsLength}
                        overflowCount={999}
                    />
                </Button>
                <Button
                    style={auctionButtonStyle}
                    shape="round"
                    onClick={() => handleAuctionFilter()}
                >
                    For Auction{" "}
                    <Badge
                        style={auctionBadgeStyle}
                        count={auctionNftsLength}
                        overflowCount={999}
                    />
                </Button>
            </Space>
        </div>
    )
}

// Further filters those NFTs that are NOT ON sale
export function NFT_SellNftFilter({
    allNftsLength,
    walletNftsLength,
    collectionNftsLength,
    showAllInactive,
    showExternal,
    showPolo,
    handleShowAllInactive,
    handleExternalFilter,
    handlePoloFilter,
}) {
    console.log("allNftsLength: ", allNftsLength)
    console.log("walletNftsLength:", walletNftsLength)
    console.log("collectionNftsLength: ", collectionNftsLength)

    console.log("showAllInactive: ", showAllInactive)
    console.log("showExternal:", showExternal)
    console.log("showPolo: ", showPolo)

    const allItemsButtonStyle = {
        background: showAllInactive ? "black" : "white",
        color: showAllInactive ? "white" : "black",
        marginLeft: "5px",
    }

    const allItemsBadgeStyle = {
        background: showAllInactive ? "white" : "black",
        color: showAllInactive ? "black" : "white",
        marginLeft: "5px",
    }

    const externalButtonStyle = {
        borderRadius: "20px",
        background: showExternal ? "black" : "white",
        color: showExternal ? "white" : "black",
    }

    const externalBadgeStyle = {
        background: showExternal ? "white" : "black",
        color: showExternal ? "black" : "white",
        marginLeft: "5px",
    }

    const mpCollectionsButtonStyle = {
        borderRadius: "20px",
        background: showPolo ? "black" : "white",
        color: showPolo ? "white" : "black",
    }

    const mpCollectionsBadgeStyle = {
        background: showPolo ? "white" : "black",
        color: showPolo ? "black" : "white",
        marginLeft: "5px",
    }

    return (
        <div>
            <Space style={{ marginBottom: "10px", background: "white" }}>
                <Button
                    style={allItemsButtonStyle}
                    shape="round"
                    onClick={() => handleShowAllInactive()}
                >
                    All Items{" "}
                    <Badge style={allItemsBadgeStyle} count={allNftsLength} overflowCount={999} />
                </Button>
                <Button
                    style={externalButtonStyle}
                    shape="round"
                    onClick={() => handleExternalFilter()}
                >
                    External NFTs{" "}
                    <Badge
                        style={externalBadgeStyle}
                        count={walletNftsLength}
                        overflowCount={999}
                    />
                </Button>
                <Button
                    style={mpCollectionsButtonStyle}
                    shape="round"
                    onClick={() => handlePoloFilter()}
                >
                    Marcopolo Collections{" "}
                    <Badge
                        style={mpCollectionsBadgeStyle}
                        count={collectionNftsLength}
                        overflowCount={999}
                    />
                </Button>
            </Space>
        </div>
    )
}

// Filters between on sale/not on sale NFTs
export function NFT_CollectionFilter({ handleShowOnSale, showOnSale }) {
    const OffSaleButtonStyle = {
        background: !showOnSale ? "black" : "white",
        color: !showOnSale ? "white" : "black",
        fontSize: "20px",
        marginLeft: "5px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }

    const OnSaleButtonStyle = {
        borderRadius: "20px",
        background: showOnSale ? "black" : "white",
        color: showOnSale ? "white" : "black",
        fontSize: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }
    return (
        <div>
            <Space style={{ paddingTop: "20px" }}>
                <Button
                    shape="round"
                    size="large"
                    style={OnSaleButtonStyle}
                    onClick={() => handleShowOnSale()}
                >
                    On Sale NFTs{" "}
                </Button>
                <Button
                    shape="round"
                    size="large"
                    style={OffSaleButtonStyle}
                    onClick={() => handleShowOnSale()}
                >
                    Off Sale NFTs{" "}
                </Button>
            </Space>
        </div>
    )
}
