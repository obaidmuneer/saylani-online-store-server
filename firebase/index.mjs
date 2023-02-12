import admin from 'firebase-admin'
import * as dotenv from 'dotenv'
dotenv.config()

var serviceAccount = {
    "type": process.env.TYPE,
    "project_id": process.env.PROJECT_ID,
    "private_key_id": process.env.PRIVATE_KEY_ID,
    "private_key": process.env.PRIVATE_KEY
        ? process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    "client_email": process.env.CLIENT_EMAIL,
    "client_id": process.env.CLIENT_ID,
    "auth_uri": process.env.AUTH_URI,
    "token_uri": process.env.TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_URL,
    "client_x509_cert_url": process.env.CLIENT_URL
}
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
});
const bucket = admin.storage().bucket(process.env.GS);

export default bucket;
