import { Schema, model } from 'mongoose'

const orderSchema = new Schema({
    ip: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: 'storeUser' },
    cart: {
        type: Schema.Types.ObjectId,
        ref: 'cart'
    },
    status: { type: String, default: 'pending' },
    isplaced: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

export default model('order', orderSchema)
