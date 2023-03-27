import { ConnectButton } from "web3uikit"
import Chains from "./Chains/Chains"
import Link from "next/link"

export default function Header() {
    return (
        <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
            <h1 className="py-4 px-4 font-bold text-3xl">Marcopolo Marketplace</h1>
            <div className="flex flex-row items-center">
                <Link href="/" passHref>
                    <a className="mr-4 p-6">🛒 Explore Market</a>
                </Link>
                <Link href="/profile" passHref>
                    <a className="mr-4 p-6">🖼 Profile</a>
                </Link>
                <Link href="/sell-nft" passHref>
                    <a className="mr-4 p-6">🖼 Create</a>
                </Link>
                <Chains />
                <ConnectButton moralisAuth={false} />
            </div>
        </nav>
    )
}
