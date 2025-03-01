const paginationResults = (page = 1, limit = 5, totalItems) => {
    page = Math.max(parseInt(page) || 1, 1)
    limit = Math.max(parseInt(limit) || 5, 1)
    let skip = (page - 1) * limit
    let totalPages = Math.ceil(totalItems / limit)

    return {
        page,
        limit,
        skip,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page - 1 : null,
        prevPage: page > 1 ? page - 1 : null
    }
}

export default paginationResults