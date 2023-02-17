import { Schema, model } from 'mongoose'

const orderItemSchema = new Schema({
    product: { type: Object },
    total: { type: String, required: true },
    quantity: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
})
const orderItemModel = model('orderItem', orderItemSchema)

export {
    orderItemModel,
    orderItemSchema
}
