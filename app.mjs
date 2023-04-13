import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from 'cookie-parser'
import * as dotenv from 'dotenv'
import productRoute from './routes/product.mjs'
import userRoute from './routes/user.mjs'
import cartRoute from './routes/cart.mjs'
import orderRoute from './routes/order.mjs'
import categoryRoute from './routes/category.mjs'
import chatbotRoute from './routes/chatbot.mjs'
import dialogflowRoute from './routes/dialogflow.mjs'
import stripeRoute from './routes/stripe.mjs'
import paymentRoute from './routes/payment.mjs'
import bodyParser from 'body-parser'

const app = express()
const port = process.env.PORT || 8080

app.use(cookieParser())
app.use(cors({
    origin: ['http://localhost:3000', "https://saylani-online-store.vercel.app", "https://saylani-online-store-obaidmuneer.vercel.app"],
    credentials: true
}))
// app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf
    }
}))

dotenv.config()
app.set('trust proxy', true)

const dbUri = process.env.DB_URI
mongoose.set('strictQuery', true);
mongoose.connect(dbUri)
//https://stackoverflow.com/questions/74747476/deprecationwarning-mongoose-the-strictquery-option-will-be-switched-back-to

app.get('/', async (req, res) => {
    res.status(200).send({
        messege: 'This is the server for saylani online store',
    })
})

app.use('/api/v1/products', productRoute)
app.use('/api/v1/users', userRoute)
app.use('/api/v1/cart', cartRoute)
app.use('/api/v1/orders', orderRoute)
app.use('/api/v1/category', categoryRoute)
app.use('/api/v1/chatbot', chatbotRoute)
app.use('/api/v1/dialogflow', dialogflowRoute)
app.use('/api/v1/stripe', stripeRoute)
app.use('/api/v1/payment', paymentRoute)

////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on('connected', function () {//connected
    console.log("Mongoose is connected");
});

mongoose.connection.on('disconnected', function () {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function (err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', function () {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});
////////////////mongodb connected disconnected events///////////////////////////////////////////////

app.listen(port, () => console.log(`Server is listening on port ${port}!`))