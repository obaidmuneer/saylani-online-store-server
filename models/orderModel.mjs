import { Schema, model } from 'mongoose'

const orderSchema = new Schema({
    ip: { type: String },
    user_id: { type: String, required: true },
    product_id: [{
        type: Schema.Types.ObjectId,
        ref: 'product'
    }],
    total: { type: String, required: true },
    status: { type: String, default: 'pending' },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

export default model('order', orderSchema)
