import express from "express";
import Joi from 'joi'
import storeUserModel from "../models/storeUserModel.mjs";
import bcrypt from 'bcrypt'
import auth from "../middlewares/auth.mjs";
import cartModel from "../models/cartModel.mjs";
import orderModel from "../models/orderModel.mjs";

const router = express.Router();

router.post('/signup', async (req, res) => {
    // console.log(req.body);
    try {
        const { firstName, lastName, email, phone, password } = req.body
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.number().required(),
            password: Joi.string().min(6).required(),
        })
        const verifiedData = await schema.validateAsync({ firstName, lastName, email, password, phone })
        // console.log(verifiedData);
        let user = new storeUserModel(verifiedData)
        const token = await user.getToken()
        await user.save()
        res.cookie('token', token, {
            expires: new Date(Date.now() + 1000 * 60 * 60),
            httpOnly: true,
            sameSite: 'none',
            secure: true,
        })
        console.log(token);
        // console.log(req.cookies.token)
        res.send({
            user
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: 'Something went wrong'
        })
    }
})

router.post('/signin', async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
        })
        const { email, password } = await schema.validateAsync(req.body)
        // console.log(password);
        let user = await storeUserModel.findOne({ email: email })
        // console.log(user);
        if (!user) throw new Error('Bad email or password')

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) throw new Error('Bad email or password')
        const cart = await cartModel.findOne({ user_id: user.id, isChecked: false })
        const orders = await orderModel.find({ user_id: user.id, isplaced: true })
            .populate('cart')
            .populate({ path: 'user_id', select: 'phone' })

        const token = await user.getToken()
        res.cookie('token', token, {
            expires: new Date(Date.now() + 1000 * 60 * 60),
            httpOnly: true,
            sameSite: 'none',
            secure: true,
        })

        // console.log(token);
        // console.log(req.cookies.token)
        res.send({
            message: 'User Logged in',
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                isAdmin: user.isAdmin
            },
            cart: cart || [],
            orders
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: 'Something went wrong'
        })
    }
})

// router.use(auth)

router.get('/logout', auth, (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'none',
        secure: true
    })
    res.status(200).send({
        message: 'Logged out successfully'
    })
})

router.get('/profile', auth, async (req, res) => {
    res.send({
        message: 'User Logged in',
        user: req.user,
        cart: req.cart,
        orders: req.orders
    })
})

export default router