import express from "express"
import "./helpers/env.js"
import ConnectToDB from "./database/db.js"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import typeDefs from "./graphql/schema.js"
import resolvers from "./graphql/resolvers.js"
import AuthRoutes from "./routes/Auth-Routes.js"
import AuthMiddleware from "./middleware/auth-middleware.js"
import UserRoutes from "./routes/User-Routes.js"




const app = express()
const PORT = process.env.PORT


ConnectToDB()


app.use(express.json())


async function startApolloServer() {
    try {   
        const server = new ApolloServer({
            typeDefs,
            resolvers
        })
        await server.start()

        app.use("/graphql", AuthMiddleware.VerifyToken, expressMiddleware(server, {
            context: async ({req}) => ({req})
        }))
        app.use("/api", AuthRoutes)
        app.use("/api", AuthMiddleware.VerifyToken, UserRoutes)

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
            console.log(`📌 GraphQL is running on http://localhost:${PORT}/graphql`)
        })
    } catch(error) {
        console.error("🚫 Failed to start Server", Error);
    }
}

startApolloServer()
