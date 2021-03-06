import { ApolloServer, makeExecutableSchema } from 'apollo-server-lambda';
import { Schema } from 'mongoose';
import dotenv from 'dotenv';
import schema from './graphql/schema';
import MongoDB from './db/Mongodb';

const { ObjectId } = Schema.Types;
ObjectId.prototype.valueOf = () => this.toString();

dotenv.config();
let conn = null;

const server = new ApolloServer(
  {
    schema: makeExecutableSchema(schema),
    introspection: true,
    playground: true,
    path: '/graphql',
    context: async ({ event, context }) => {
      const envVariables = event.stageVariables || {
        MONGO_URL: process.env.MONGO_URL,
        SYMPLA_KEY: process.env.SYMPLA_KEY,
      };

      conn = await MongoDB({
        conn,
        mongoUrl: envVariables.MONGO_URL ? `mongodb+${envVariables.MONGO_URL}` : null,
      });

      return ({
        headers: event.headers,
        functionName: context.functionName,
        event,
        context,
        // connection
        users: conn.model('users'),
        activities: conn.model('activities'),
        events: conn.model('events'),
        tickets: conn.model('tickets'),
        FAQQuestions: conn.model('faq-questions'),
        shows: conn.model('shows'),
        votes: conn.model('votes'),
        SYMPLA_KEY: envVariables.SYMPLA_KEY,
      });
    },
  },
);

const graphqlHandler = server.createHandler({
  cors: {
    origin: '*',
    credentials: true,
  },
  tracing: true,
});
export { graphqlHandler };
export default graphqlHandler;
