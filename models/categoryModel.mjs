import { Schema, model } from 'mongoose'

const categorySchema = new Schema({
    ip: { type: String },
    title: { type: String, required: true },
    file: { type: String, required: true },
    fileName: { type: String, required: true }, 
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})
export default model('category', categorySchema)

