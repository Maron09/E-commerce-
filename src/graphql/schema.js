import gql from "graphql-tag"


const typeDefs = gql`
    type Product {
        id: ID!
        title: String!
        category: String!
        price: Float!
        inStock: Boolean!
    }

    type PaginatedProducts {
        products: [Product!]!
        pagination: PaginationInfo!
    }

    type PaginationInfo {
        page: Int!
        limit: Int!
        totalPages: Int!
        hasNextPage: Boolean!
        hasPrevPage: Boolean!
        nextPage: Int
        prevPage: Int
    }

    type ProductResponse {
        success: Boolean!
        message: String!
        product: Product
    }

    type Query {
        paginatedProducts(page: Int, limit: Int): PaginatedProducts!
        product(id: ID!): ProductResponse
    }
`

export default typeDefs