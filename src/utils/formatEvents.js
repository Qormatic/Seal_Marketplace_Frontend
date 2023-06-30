export const getTokenProvenance = (tokenEvents) => {
    // Filter out null event objects
    const nonNullObjects = Object.values(tokenEvents)
        .filter((array) => array.length !== 0) // filter out empty arrays
        .flat() // flatten the array of arrays
        .filter((obj) => obj !== null) // filter out null values

    console.log("nonNullObjects: ", nonNullObjects)

    // Sort non-null objects by ascending block.timestamp - oldest first
    const sortedObjects = nonNullObjects.sort((obj1, obj2) => {
        const block1 = obj1.block
        const block2 = obj2.block
        return block2.number - block1.number
    })

    console.log("sortedObjects: ", sortedObjects)

    // Update our events ready to be displayed in front end
    return sortedObjects
        .map(({ block: { timestamp }, ...rest }) => ({
            ...rest,
            timestamp,
        }))
        .map((obj) =>
            Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined))
        )
        .map((obj) => {
            const options = {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                hour12: true,
                minute: "2-digit",
                second: "2-digit",
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }
            const { __typename, ...rest } = obj
            return {
                ...rest,
                timestamp: new Date(obj.timestamp * 1000)
                    .toLocaleString("en-GB", options)
                    .split(", ")
                    .join(" @ "),
                __typename: __typename.split(/(?=[A-Z][^A-Z])/).join(" "),
            }
        })
}
