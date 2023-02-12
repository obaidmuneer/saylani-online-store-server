import { Schema, model } from 'mongoose'

const productSchema = new Schema({
    ip: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    file: { type: String },
    fileName: { type: String },
    description: { type: String, required: true },
    unit_name: { type: String, required: true },
    unit_price: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})
export default model('doc', productSchema)
