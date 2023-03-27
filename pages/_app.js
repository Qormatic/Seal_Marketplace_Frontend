/////////////
// UPDATES //
/////////////

/**
 * Rename Home to "index.js"                                    ✔
 * Support Mumbai, Goerli                                       ✔
 * New page called "My NFTs"                                    ✔
 *      ---> API w/ hidden creds pulling info in                ✔
 *      ---> containing NFT tokens you own on cards             ✔
 *           not collections as we expect one of ones
 *      ---> click card gives more token info
 *      ---> card has "List" & "Auction" buttons
 *      ---> buttons open form modals
 *      ---> form modals trigger functions
 * Search bar for searching collection names
 * NFTs not loading when switch to Goerli on "index.js"
 *      ---> Clear Goerli listings when switch to Mumbai
 * Loading bar on "index.js" & My NFTs
 * Price shouls reflect chain we are on
 * Get tokenURI same way for My NFTs as we do for "index.js"
 * Make links etc more efficient - they're very slow
 * get rid of the shite concats
 * new gql queries?
 *
 * Performance:
 * look into useMemo from React to reduce re-renders
 * look into recat fragments instead of <divs>
 * desctructuring
 * the key attribute should be applied to the HTML element that is actually being repeated e.g. in the <div> directly after the mapping of an HTML object
 *        ---> see [tokenId].js for example
 */

import "../styles/globals.css"
import { MoralisProvider } from "react-moralis"
import Header from "../components/Header"
import Head from "next/head"
import { NotificationProvider } from "web3uikit"
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client"

const client = new ApolloClient({
    cache: new InMemoryCache(),
    uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
})

function MyApp({ Component, pageProps }) {
    return (
        <div>
            <Head>
                <title>Marcopolo Marketplace</title>
                <meta name="description" content="Marcopolo Marketplace" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {/* "initializeOnMount={false}" tells our app that we are not going to use a Moralis server; just use their opensource software tools */}
            {/* Providers wrap around all the components in _app.js so that each component from the top down knows about it */}
            {/* Our entire app is routed through _app.js. Our exported page components (e.g. index.js) replace "<Component />" as we navigate */}
            <MoralisProvider initializeOnMount={false}>
                <ApolloProvider client={client}>
                    <NotificationProvider>
                        <Header />
                        <Component {...pageProps} />
                    </NotificationProvider>
                </ApolloProvider>
            </MoralisProvider>
        </div>
    )
}

export default MyApp
