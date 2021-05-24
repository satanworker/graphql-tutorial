require('dotenv').config();
const { ApolloServer } = require('apollo-server')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const { createStore } = require('./utils')

const LaunchAPI = require('./datasources/launch')
const UserAPI = require('./datasources/user');
const IsEmail = require('isemail');

const store = createStore()

const server = new ApolloServer({
  typeDefs,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store })
  }),
  resolvers,
  context: async (context) => {
    const { req } = context
    const auth = req.headers && req.headers.authorization || ''
    const email = Buffer.from(auth, 'base64').toString('ascii')
    if (!IsEmail.validate(email)) return { user: null }
    const users = await store.users.findOrCreate({ where: { email } })
    const user = users && users[0] || null
    return { user: { ...user.dataValues } }
  }
})

server.listen().then(() => {
  console.log(`
    Server is running!
    Listening on port 4000
    Explore at https://studio.apollographql.com/dev
  `);
});