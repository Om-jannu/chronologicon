const isUUID = (value) => {

    if (!value) return false

    const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

    return uuidRegex.test(value)
}

const validateEvent = (parts) => {

    if (!Array.isArray(parts) || parts.length < 7) {
        return { valid: false, error: "Malformed row" }
    }

    const [
        eventId,
        eventName,
        startDate,
        endDate,
        parentId,
        researchValue,
        description
    ] = parts

    // Validate eventId
    if (!isUUID(eventId)) {
        return { valid: false, error: "Invalid eventId UUID" }
    }

    // Validate parentId
    let parsedParent = null

    if (parentId && parentId !== "NULL") {

        if (!isUUID(parentId)) {
            return { valid: false, error: "Invalid parentId UUID" }
        }

        parsedParent = parentId
    }

    if (!eventName) {
        return { valid: false, error: "Missing eventName" }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start) || isNaN(end)) {
        return { valid: false, error: "Invalid date format" }
    }

    if (end < start) {
        return { valid: false, error: "End date before start date" }
    }

    const rv = parseInt(researchValue)

    if (isNaN(rv)) {
        return { valid: false, error: "Invalid researchValue" }
    }

    return {
        valid: true,
        data: {
            eventId,
            eventName,
            startDate: start,
            endDate: end,
            parentId: parsedParent,
            researchValue: rv,
            description
        }
    }
}

module.exports = { isUUID, validateEvent }