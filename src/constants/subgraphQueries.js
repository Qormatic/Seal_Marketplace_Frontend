import { gql } from "@apollo/client"

// DO NOT FORGET STRING LITERALS WHEN PASSING A VARIABLE INTO A QUERY; E.g. ${profile} instead of profile

// get activeItems where buyer is zeroAddress
export const GET_ACTIVE_ITEMS = gql`
    {
        activeFixedPriceItems(
            first: 100
            where: { buyer: "0x0000000000000000000000000000000000000000" } # buyer == zeroAddress as this means it is unsold
        ) {
            id
            buyer
            seller
            nftAddress
            tokenId
            price
        }
        activeAuctionItems(
            first: 100
            where: { resulted: false, canceled: false } # endTime > now
        ) {
            id
            nftAddress
            tokenId
            seller
            reservePrice
            startTime
            endTime
            buyer
            highestBid
            resulted
            canceled
        }
    }
`

export const GET_ACTIVE_COLLECTIONS = gql`
    {
        activeFixedPriceItems(
            first: 100,
            where: { buyer: "0x0000000000000000000000000000000000000000" } # buyer == zeroAddress as this means it is unsold
        ) {
            id
            buyer
            seller
            nftAddress
            tokenId
            price
        }
        activeAuctionItems(
            first: 100,
            where: { endTime_gt: ${Math.floor(Date.now() / 1000)} } # endTime > now
) {
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
        contractCreateds(first: 100) {
            contractAddress
            id
            owner
  }

    }
`

// where with two parameters:
// where: {nftAddress: $nftAddress, tokenId: $tokenId}

export const GET_TOKEN_ACTIVE_ITEMS = gql`
    query GetTokenActives($id: ID!) {
        activeAuctionItems(
            first: 100 # default returned is 100
            orderBy: endTime # sort by descending endTime which gives us the most recent auctions first
            orderDirection: desc
            where: { id: $id }
        ) {
            id
            nftAddress
            tokenId
            seller
            reservePrice
            startTime
            endTime # auction is over if endTime < now
            buyer # empty if no bids; if there are bids, this will be the highest bidder or winner if auction is over
            highestBid # if no bids, this will be null
            canceled
            resulted
        }
        activeFixedPriceItems(
            first: 100 # default returned is 100
            where: { buyer: "0x0000000000000000000000000000000000000000", id: $id } # buyer == zeroAddress as this means it is unsold
        ) {
            id
            buyer
            seller
            nftAddress
            tokenId
            price
        }
    }
`

export const GET_TOKEN_HISTORY = gql`
    query GetTokenHistory($id: ID!) {
        # In GraphQL, the exclamation mark ! after a type or a parameter indicates that it is a non-null value.
        # $id is the variable that will be passed into the query
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
            seller
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
