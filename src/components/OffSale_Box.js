import Link from "next/link"
import Image from "next/image"
import placeholder from "../../public/images/placeholder.png"
import { Card } from "antd"
import { useState } from "react"

const { Meta } = Card

// props passed to NFTBox from index.js
export default function OffSale_Box({ nftAddress, tokenId, imageUri }) {
    const [src, setSrc] = useState(imageUri)

    const handleError = () => {
        setSrc("/images/placeholder.png")
    }

    console.log("imageUri: ", imageUri)
    return (
        <div>
            {nftAddress ? (
                <Link
                    href="/collection/[collectionAddress]/[tokenId]"
                    as={`/collection/${nftAddress}/${tokenId}`}
                >
                    <a>
                        <Card
                            hoverable
                            style={{ width: "90%", margin: 10 }}
                            cover={
                                <Image src={src} onError={handleError} height="250" width="250" />
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
                                            whiteSpace: "normal",

                                            width: "100%",
                                        }}
                                    >
                                        {nftAddress}
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
                                            {tokenId}
                                        </h1>
                                    </div>
                                }
                            />
                        </Card>
                    </a>
                </Link>
            ) : (
                <div>Loading...</div>
            )}
        </div>
    )
}
