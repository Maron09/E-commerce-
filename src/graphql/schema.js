import gql from "graphql-tag"


const typeDefs = gql`
    type User {
        id: ID!
        firstName: String!
        lastName: String!
        email: String!
        role: String!
        businessName: String
        isVerified: Boolean!
        isActive: Boolean!
    }

    type PaginatedUsers {
        users: [User!]!
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

    type UserResponse {
        success: Boolean!
        message: String!
        user: User
    }

    type Query {
        paginatedUsers(page: Int, limit: Int): PaginatedUsers!
        user(id: ID!): UserResponse
    }
`

export default typeDefs