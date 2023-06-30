import { gql } from "@apollo/client"

// DO NOT FORGET STRING LITERALS WHEN PASSING A VARIABLE INTO A QUERY; E.g. ${profile} instead of profile

// get activeItems where buyer is zeroAddress
export const GET_ACTIVE_ITEMS = gql`
    {
        activeFixedPriceItems(
            first: 100
            where: { resulted: false, canceled: false } # buyer == zeroAddress as this means it is unsold
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

export const TOKEN_ON_SALE_RECORD = gql`
    query GetTokenActives($id: ID!) {
        activeAuctionItems(first: 1, where: { id: $id, canceled: false, resulted: false }) {
            id
            nftAddress
            tokenId
            seller
            reservePrice
            startTime
            endTime
            buyer
            highestBid
            canceled
            resulted
        }
        activeFixedPriceItems(first: 1, where: { id: $id, canceled: false, resulted: false }) {
            id
            buyer
            seller
            nftAddress
            tokenId
            price
            canceled
            resulted
        }
    }
`

export const GET_TOKEN_HISTORY = gql`
    query GetTokenHistory($nftAddress: Bytes!, $tokenId: BigInt!) {
        tokenMinteds(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            minter
            nftAddress
            block {
                id
                number
                timestamp
            }
        }
        auctionCancelleds(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            nftAddress
            seller
            block {
                id
                number
                timestamp
            }
        }
        auctionCreateds(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            endTime
            nftAddress
            reservePrice
            seller
            startTime
            block {
                id
                number
                timestamp
            }
        }
        auctionResulteds(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            nftAddress
            seller
            winner
            winningBid
            block {
                id
                number
                timestamp
            }
        }
        bidPlaceds(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            HighestBid
            HighestBidder
            nftAddress
            block {
                id
                number
                timestamp
            }
        }
        itemBoughts(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            buyer
            nftAddress
            price
            block {
                id
                number
                timestamp
            }
        }
        itemCanceleds(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            nftAddress
            seller
            block {
                id
                number
                timestamp
            }
        }
        itemListeds(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            nftAddress
            price
            seller
            block {
                id
                number
                timestamp
            }
        }
        itemUpdateds(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            nftAddress
            price
            seller
            block {
                id
                number
                timestamp
            }
        }
        updateAuctionEndTimes(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            endTime
            nftAddress
            block {
                id
                number
                timestamp
            }
        }
        updateAuctionReservePrices(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            nftAddress
            reservePrice
            block {
                id
                number
                timestamp
            }
        }
        updateAuctionStartTimes(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            nftAddress
            startTime
            block {
                id
                number
                timestamp
            }
        }
        bidWithdrawns(where: { nftAddress: $nftAddress, tokenId: $tokenId }) {
            id
            tokenId
            HighestBid
            HighestBidder
            nftAddress
            block {
                id
                number
                timestamp
            }
        }
    }
`

export const GET_USER_COLLECTION = gql`
    query GetCollection($id: ID!) {
        contractCreated(id: $id) {
            id
            contractAddress
            owner
            tokenType
            symbol
            royaltiesReceiver
            royaltiesPercentage
            privateView
            name
            block {
                timestamp
            }
        }
    }
`

export const GET_ACTIVE_COLLECTION_ITEMS = gql`
    query GetActiveCollectionItems($collectionAddress: String!, $currentTime: Int!) {
        activeFixedPriceItems(
            first: 100
            where: { nftAddress: $collectionAddress, canceled: false, resulted: false }
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
            where: { endTime_gt: $currentTime, nftAddress: $collectionAddress }
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
