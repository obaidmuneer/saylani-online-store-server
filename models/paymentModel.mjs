import { Schema, model } from 'mongoose'

const paymentSchema = new Schema({
    cart_id: { type: Schema.Types.ObjectId, ref: 'cart' },
    user_id: { type: Schema.Types.ObjectId, ref: 'storeUser' },
    payment_email: { type: String, required: true },
    payment_id: { type: String, required: true },
    total: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
})

export default model('payment', paymentSchema)
