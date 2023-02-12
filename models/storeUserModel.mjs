import { Schema, model } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
dotenv.config()

const storeUserSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    createdAt: { type: Date, default: Date.now }
})

storeUserSchema.methods.getToken = async function () {
    try {
        const token = jwt.sign({
            id: this._id,
            isAdmin: this.isAdmin,
            iat: Math.floor(Date.now() / 1000) - 30,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        }, process.env.SECRET_KEY);
        return token
    } catch (error) {
        return error
    }
}

storeUserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        let hashPassword = await bcrypt.hash(this.password, 12)
        this.password = hashPassword
    }
    next()
})

export default model('storeUser', storeUserSchema)
