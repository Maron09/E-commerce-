import gql from "graphql-tag"


const typeDefs = gql`
    type User {
        id: ID!
        firstName: String!
        lastName: String!
        email: String!
        role: String!
        businessName: String
        isVerified: Boolean
        isActive: Boolean
    }

    type UserProfile {
        id: ID!
        user: User!
        profilePicture: String
        phoneNumber: String
        address: Address
        createdAt: String!
        updatedAt: String!
    }

    type Address {
        street: String
        city: String
        state: String
        zipcode: Int
        country: String
    }

    input AddressInput {
        street: String
        city: String
        state: String
        zipcode: Int
        country: String
    }

    input UpdateUserProfileInput {
        userId: ID!
        phoneNumber: String
        address: AddressInput
        firstName: String
        lastName: String
        email: String
    }


    type PaginatedUsers {
        users: [User!]!
        pagination: PaginationInfo!
    }

    type PaginatedUserProfiles {
        userProfiles: [UserProfile!]!
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

    type UserProfileResponse {
        success: Boolean!
        message: String!
        userProfile: UserProfile
    }

    type Category {
        id: ID!
        name: String!
        createdAt: String!
    }

    type CategoryResponse {
        success: Boolean!
        message: String!
        category: Category
    }

    type DeleteCategoryResponse {
        success: Boolean!
        message: String!
    }

    type Product {
        id: ID!
        name: String!
        price: Float!
        stock: Int!
        category: Category!
        images: [String!]!
        vendor: User!
        createdAt: String!
    }

    type Query {
        paginatedUsers(page: Int, limit: Int): PaginatedUsers!
        user(id: ID!): UserResponse
        paginatedUserProfiles(page: Int, limit: Int): PaginatedUserProfiles!
        userProfile(id: ID!): UserProfileResponse
        categories: [Category!]!
        category(id: ID!): CategoryResponse
    }

    type Mutation {
        CreateCategory(
            name: String!
            createdAt: String
        ): CategoryResponse

        DeleteCategory(id: ID!): DeleteCategoryResponse

        UpdateCategory(
            id: ID!
            name: String
        ): CategoryResponse

        UpdateUserProfile(
            input: UpdateUserProfileInput!
        ): UserProfileResponse!
    }
`

export default typeDefs