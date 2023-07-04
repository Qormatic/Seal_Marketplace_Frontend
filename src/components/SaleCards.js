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
    // Countdown,
    Space,
    List,
    message,
    Statistic,
    notification,
} from "antd"

import { useEffect, useState } from "react"

const { Title, Text } = Typography
const { Countdown } = Statistic

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

export const FixedPriceDisplay = ({ handleButtonClick, isOwner, price }) => {
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
                disableButton={isOwner}
                handleButtonClick={handleButtonClick}
            />
        </>
    )
}

export const OfferDisplay = ({ handleButtonClick, isOwner }) => {
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
                disableButton={isOwner}
                handleButtonClick={handleButtonClick}
            />
        </>
    )
}

export const AuctionDisplay = ({
    endTime,
    buyer,
    highestBid,
    reservePrice,
    isOwner,
    userIsHighbidder,
    handleButtonClick,
}) => {
    const formattedEndTime = endTime * 1000

    const onFinish = () => {
        console.log("TIMER FINISHED")
    }

    return (
        <>
            {formattedEndTime < Date.now() ? (
                // display if endTime in past and auction not yet resulted or canceled
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
                                format={`HH:mm:ss`} // format={""} format will show value at same time as prefix unless we comment out
                                value={Date.now()} // This will set the timer to "00:00:00" because the value is the current time
                            />
                        </Col>
                    </Row>
                    <SaleCardButton
                        title={
                            isOwner
                                ? highestBid
                                    ? "Result Auction"
                                    : "Cancel Auction"
                                : "Auction Ended"
                        }
                        buyer={buyer}
                        disableButton={!isOwner}
                        handleButtonClick={handleButtonClick}
                    />
                </div>
            ) : (
                // display if countdown still ongoing
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
                                format={`HH:mm:ss`} // format={""} format will show value at same time as prefix unless we comment out
                                value={formattedEndTime}
                                onFinish={onFinish}
                            />
                        </Col>
                    </Row>
                    <SaleCardButton
                        title={isOwner ? "Cancel Auction" : "Place Bid"}
                        buyer={buyer}
                        disableButton={userIsHighbidder}
                        handleButtonClick={handleButtonClick}
                    />
                </div>
            )}
        </>
    )
}
