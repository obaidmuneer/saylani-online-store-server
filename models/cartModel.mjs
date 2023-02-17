import { Schema, model } from 'mongoose'
import { orderItemSchema } from './orderItemModel.mjs'

const cartSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'storeUser' },
    orders: [{
        type: orderItemSchema,
        required: true,
    }],
    total: { type: String, required: true },
    isChecked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

export default model('cart', cartSchema)
