import Link from "next/link"
import Image from "next/image"
import { truncateStr, formatUnits } from "@/utils/truncate"
import { Card, Tooltip } from "antd"

const { Meta } = Card

// props passed to NFTBox from index.js
export default function Collection_Box({ name, contractAddress, symbol }) {
    return (
        <div>
            {contractAddress ? (
                <Link href="/collection/[collectionAddress]" as={`/collection/${contractAddress}`}>
                    <a>
                        <Card
                            hoverable
                            style={{ width: "90%", margin: 10 }}
                            cover={
                                <Image src={"/images/placeholder.png"} height="250" width="250" />
                            }
                        >
                            <Meta
                                title={
                                    <div
                                        style={{
                                            fontSize: "20px",
                                            fontWeight: "bold",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            // whiteSpace: "nowrap",
                                            whiteSpace: "normal",

                                            width: "100%",
                                        }}
                                    >
                                        {name}
                                    </div>
                                }
                                description={
                                    <div style={{ whiteSpace: "pre-wrap" }}>
                                        <h1
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {symbol}
                                        </h1>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                // fontWeight: "bold",
                                            }}
                                        >
                                            {truncateStr(contractAddress, 15)}{" "}
                                        </p>
                                    </div>
                                }
                            />
                        </Card>
                    </a>
                </Link>
            ) : (
                <a>
                    <Card
                        style={{ width: "90%", margin: 10 }}
                        cover={<Image src={"/images/placeholder.png"} height="250" width="250" />}
                    >
                        <Meta
                            title={
                                <div
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        // whiteSpace: "nowrap",
                                        whiteSpace: "normal",
                                        width: "100%",
                                    }}
                                >
                                    {truncateStr(contractAddress, 15)}
                                </div>
                            }
                        />
                    </Card>
                </a>
            )}
        </div>
    )
}
