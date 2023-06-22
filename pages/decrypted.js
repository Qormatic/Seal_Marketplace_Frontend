import CryptoJS from "crypto-js"
import { useEffect, useState, useRef } from "react"
import {
    Layout,
    Row,
    Col,
    Image,
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

export default function Profile() {
    const [decryptedImageUrl, setDecryptedImageUrl] = useState("")

    async function decryptImage() {
        // Fetch the image data
        const response = await fetch(
            "https://ipfs.io/ipfs/QmWPAaXpaVei3Fgjqo2fDZzoPVieCrSMCpzqc1CXGgetys/21.png"
        )

        console.log("response: ", response)

        const jsonData = await response.json()

        console.log("jsonData: ", jsonData)

        const encryptedString = jsonData.encryptedData

        console.log("encryptedString: ", encryptedString)

        // Decrypt the image data which returns a Wordarray
        const decryptedData = CryptoJS.AES.decrypt(
            encryptedString,
            process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY
        )

        // Convert decrypted data back to ArrayBuffer from WordArray
        let wordArray = decryptedData
        let byteArray = wordArrayToByteArray(wordArray, wordArray.sigBytes)
        // Uint8Array is a type of array specifically designed to hold bytes
        let arrayBuffer = new Uint8Array(byteArray).buffer

        console.log("wordArray: ", wordArray)
        console.log("byteArray: ", byteArray)
        console.log("arrayBuffer: ", arrayBuffer)

        // Convert to blob
        const decryptedBlob = new Blob([arrayBuffer], {
            type: jsonData.fileType, // or whatever the original file type was
        })
        // Convert to object URL which can be displayed in the front end
        const imageUrl = URL.createObjectURL(decryptedBlob)

        // Set the state of the image URL
        setDecryptedImageUrl(imageUrl)
    }

    // Convert WordArray back into a byteArray
    function wordArrayToByteArray(wordArray, numSigBytes) {
        let byteArray = [], // initialise empty array
            word,
            i,
            j

        /*  Loop over each word in WordArray where each word is a 32-bit number
            nested loop iterates over the 4 bytes in the current word
            extract each byte from the word and pushes it into the byteArray
        */
        for (i = 0; i < numSigBytes / 4; i++) {
            word = wordArray.words[i]
            for (j = 3; j >= 0; j--) {
                byteArray.push((word >> (8 * j)) & 0xff)
            }
        }
        return byteArray
    }

    useEffect(() => {
        decryptImage()
    }, [])

    return (
        <div>
            {/* {decryptedImageUrl && <img sizes={10} src={decryptedImageUrl} alt="Decrypted" />} */}
            {decryptedImageUrl && (
                <Image src={decryptedImageUrl} alt="Decrypted" width={400} height={400} />
            )}
        </div>
    )
}
