import dotenv from 'dotenv';

dotenv.config();

const config = {
    server: {
        port: process.env.SERVER_PORT
    },

    values_db: {
        token: process.env.INFLUX_API_CONNECTION_TOKEN,
        organization: process.env.INFLUX_API_CONNECTION_ORG,
        bucket: process.env.INFLUX_API_CONNECTION_BUCKET
    },

    users_db: {
        token: process.env.MONGO_API_CONNECTION_TOKEN,
        db: process.env.MONGO_DATABASE,
        ucoll: process.env.MONGO_USERSCOLLECTION,
        dcoll: process.env.MONGO_DEVICESCOLLECTION
    }

};

export default config;