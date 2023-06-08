// customised 500 error page returned if getStaticProps retrieves no data
// not returned in development mode

export default function Custom500() {
    return <h1>You are seeing this 500 error because the requested page does not exist</h1>
}
