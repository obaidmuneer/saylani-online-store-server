import { Schema, model } from 'mongoose'

const categorySchema = new Schema({
    ip: { type: String, required: true },
    category: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})
export default model('productCategory', categorySchema)

