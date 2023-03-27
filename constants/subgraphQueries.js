import { gql } from "@apollo/client"

// get activeItems where buyer is zeroAddress
export const GET_ACTIVE_ITEMS = gql`
    {
        activeFixedPriceItems(
            first: 5
            where: { buyer: "0x0000000000000000000000000000000000000000" }
        ) {
            id
            buyer
            seller
            nftAddress
            tokenId
            price
        }
        activeAuctionItems(first: 5) {
            id
            nftAddress
            tokenId
            seller
            reservePrice
            startTime
            endTime
            buyer
            highestBid
        }
    }
`

export const GET_TOKEN_HISTORY = gql`
    query GetTokenHistory($id: String!) {
        auctionCancelled(id: $id) {
            id
            nftAddress
            seller
            block {
                id
                number
                timestamp
            }
        }
        auctionCreated(id: $id) {
            endTime
            id
            nftAddress
            reservePrice
            seller
            startTime
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        auctionResulted(id: $id) {
            id
            nftAddress
            seller
            tokenId
            winner
            winningBid
            block {
                id
                number
                timestamp
            }
        }
        bidPlaced(id: $id) {
            HighestBid
            HighestBidder
            id
            nftAddress
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        itemBought(id: $id) {
            buyer
            id
            nftAddress
            price
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        itemCanceled(id: $id) {
            id
            nftAddress
            seller
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        itemListed(id: $id) {
            id
            nftAddress
            price
            seller
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        itemUpdated(id: $id) {
            id
            nftAddress
            price
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        updateAuctionEndTime(id: $id) {
            endTime
            id
            nftAddress
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        updateAuctionReservePrice(id: $id) {
            id
            nftAddress
            reservePrice
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        updateAuctionStartTime(id: $id) {
            id
            nftAddress
            startTime
            tokenId
            block {
                id
                number
                timestamp
            }
        }
        bidWithdrawn(id: $id) {
            HighestBid
            HighestBidder
            id
            nftAddress
            tokenId
            block {
                id
                number
                timestamp
            }
        }
    }
`
