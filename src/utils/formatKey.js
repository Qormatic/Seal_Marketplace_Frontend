export const formatKey = (key) => {
    // Capitalize the first character of each word
    key = key.replace(/\b\w/g, (l) => l.toUpperCase())

    // Replace underscores with spaces
    key = key.replace(/_/g, " ")

    // Specific replacements
    key = key.replace("CollectionName", "Collection Name")
    key = key.replace("SealContract", "Seal Contract")
    key = key.replace("PrivateView", "Private View")

    return key
}
