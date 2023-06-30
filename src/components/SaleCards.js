import styles from "@/styles/components.module.css"

import {
    Layout,
    Row,
    Col,
    Typography,
    Card,
    Button,
    Avatar,
    Divider,
    Space,
    List,
    message,
    Statistic,
    notification,
} from "antd"
const { Title, Text } = Typography

// rendered differently depending on if it comes from fixedPriceDisplay or auctionDisplay
const SaleCardButton = ({ handleButtonClick, title, disableButton }) => {
    return (
        <Button
            block
            disabled={disableButton}
            type="primary"
            size="large"
            shape="round"
            className={`${styles["sale-card-button"]} ${disableButton ? styles.disabled : ""}`}
            onClick={() => handleButtonClick(title)}
        >
            {title}
        </Button>
    )
}

export const FixedPriceDisplay = ({ handleButtonClick, userIsSeller, price }) => {
    return (
        <>
            <Title type="secondary" level={4}>
                Fixed Price
            </Title>
            <Title level={3} style={{ margin: 0 }} type="primary">
                Price {price} ETH
            </Title>
            <SaleCardButton
                title={"Buy Now"}
                disableButton={userIsSeller}
                handleButtonClick={handleButtonClick}
            />
        </>
    )
}

export const OfferDisplay = ({ handleButtonClick, userIsSeller }) => {
    return (
        <>
            <Title type="secondary" level={4}>
                Make Offer
            </Title>
            <Title level={3} style={{ margin: 0 }} type="primary">
                Not Currently On Sale
            </Title>
            <SaleCardButton
                title={"Make Offer"}
                disableButton={userIsSeller}
                handleButtonClick={handleButtonClick}
            />
        </>
    )
}

export const AuctionDisplay = ({
    buyer,
    endTime,
    onFinish,
    highestBid,
    reservePrice,
    userIsSeller,
    userIsHighbidder,
    handleButtonClick,
}) => {
    console.log("userIsSeller: ", userIsSeller)
    console.log("userIsHighbidder: ", userIsHighbidder)

    return (
        <>
            {endTime < Date.now() / 1000 ? ( // display if endTime in past and auction not resulted or canceled
                <div>
                    <Row style={{ height: "100%" }}>
                        <Col span={11}>
                            <Title type="secondary" level={4}>
                                Auction
                            </Title>
                            <Title level={4} style={{ margin: 0 }} type="primary">
                                {highestBid ? `Winning Bid ${highestBid} ETH` : "No Winning Bid"}
                            </Title>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginTop: "10px",
                                }}
                            >
                                <Title type="secondary" level={4} style={{ marginTop: "5px" }}>
                                    {highestBid ? "Winner" : "No Winner"}
                                </Title>
                                {highestBid !== 0 && highestBid && (
                                    <Link href="/profile/[profile]" as={`/profile/${buyer}`}>
                                        <a>
                                            <Button
                                                style={{ marginLeft: "10px", marginTop: 0 }}
                                                shape="round"
                                            >
                                                {truncateStr(buyer ?? "", 15)}
                                            </Button>
                                        </a>
                                    </Link>
                                )}
                            </div>
                        </Col>
                        <Col span={2}>
                            <Divider
                                type="vertical"
                                style={{
                                    marginTop: "0 10px",
                                    height: "100%",
                                    width: "10px",
                                }}
                            />
                        </Col>
                        <Col span={11}>
                            <Title type="secondary" level={4}>
                                Time Remaining
                            </Title>
                            <Countdown
                                format={`DD:HH:mm:ss`} //format={""} format will show value at same time as prefix unless we comment out
                                value={endTime * 1000}
                                onFinish={() => onFinish()}
                            />
                        </Col>
                    </Row>

                    <SaleCardButton
                        title={
                            userIsSeller
                                ? highestBid
                                    ? "Result Auction"
                                    : "Cancel Auction"
                                : "Auction Ended"
                        }
                        buyer={buyer}
                        disableButton={!userIsSeller}
                        handleButtonClick={handleButtonClick}
                    />
                </div>
            ) : (
                <div>
                    <Row style={{ height: "100%" }}>
                        <Col span={11}>
                            <Title type="secondary" level={4}>
                                Auction
                            </Title>
                            <Title level={3} style={{ margin: 0 }} type="primary">
                                {highestBid
                                    ? `Current Bid ${highestBid} ETH`
                                    : `Reserve ${reservePrice} ETH`}
                            </Title>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginTop: "10px",
                                }}
                            >
                                <Title type="secondary" level={4} style={{ marginTop: "5px" }}>
                                    {highestBid ? "Current Bidder" : "No Bids"}
                                </Title>
                                {highestBid !== 0 && highestBid && (
                                    <Link href="/profile/[profile]" as={`/profile/${buyer}`}>
                                        <a>
                                            <Button
                                                style={{ marginLeft: "10px", marginTop: 0 }}
                                                shape="round"
                                            >
                                                {truncateStr(
                                                    userIsHighbidder ? "You" : buyer ?? "",
                                                    15
                                                )}
                                            </Button>
                                        </a>
                                    </Link>
                                )}
                            </div>
                        </Col>

                        <Col span={2}>
                            <Divider
                                type="vertical"
                                style={{
                                    marginTop: "0 10px",
                                    height: "100%",
                                    width: "10px",
                                }}
                            />
                        </Col>
                        <Col span={11}>
                            <Title type="secondary" level={4}>
                                Time Remaining
                            </Title>
                            <Countdown
                                format={`DD:HH:mm:ss`} //format={""} format will show value at same time as prefix unless we comment out
                                value={endTime * 1000}
                                onFinish={() => onFinish()}
                            />
                        </Col>
                    </Row>
                    <SaleCardButton
                        title={userIsSeller ? "Cancel Auction" : "Place Bid"}
                        buyer={buyer}
                        disableButton={userIsHighbidder}
                        handleButtonClick={handleButtonClick}
                    />
                </div>
            )}
        </>
    )
}
