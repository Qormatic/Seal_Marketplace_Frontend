import { getDecryptedImage } from "@/utils/decryptImage"

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { imageUri } = req.body

        const base64Image = await getDecryptedImage(imageUri)

        // Convert the base64 string to a Data URL
        const decryptedImageUri = `data:image/png;base64,${base64Image}` // replace 'image/png' with the correct MIME type

        res.status(200).json({ decryptedImageUri })
    } else {
        res.status(405).json({ error: "Method not allowed." })
    }
}
