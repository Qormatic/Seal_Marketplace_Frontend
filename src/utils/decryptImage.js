/////////////////////
//  Decrypt Image  //
/////////////////////

import CryptoJS from "crypto-js"

export const getDecryptedImage = async (imageUri) => {
    const response = await fetch(imageUri)
    const jsonData = await response.json()
    const encryptedString = jsonData.encryptedData

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

    // Convert to blob
    const decryptedBlob = new Blob([arrayBuffer], {
        type: jsonData.fileType, // or whatever the original file type was
    })
    // Convert to object URL which can be displayed in the front end
    const imageUrl = URL.createObjectURL(decryptedBlob)

    // Return the decrypted image URL
    return imageUrl
}

// Convert WordArray back into a byteArray
function wordArrayToByteArray(wordArray, numSigBytes) {
    let byteArray = [], // initialise empty array
        word,
        i,
        j

    /*  
            Loop over each word in WordArray where each word is a 32-bit number
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
