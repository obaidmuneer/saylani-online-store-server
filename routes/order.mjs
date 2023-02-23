import express from "express";
import Joi from 'joi'
import * as dotenv from 'dotenv'

import auth from "../middlewares/auth.mjs";
import cartModel from "../models/cartModel.mjs";
import orderModel from "../models/orderModel.mjs";

const router = express.Router()
dotenv.config()

router.use(auth)

router.post('/', async (req, res) => {
    const schema = Joi.object({
        cart_id: Joi.string().required(),
        name: Joi.string().required(),
        address: Joi.string().required(),
    })
    try {
        const { cart_id, name, address } =
            await schema.validateAsync(req.body);

        const cart = await cartModel.findById(cart_id)

        if (!cart) return res.status(404).send({
            messege: {
                type: 'error',
                text: 'Cart not found'
            }
        })
        const order = await orderModel.create({
            name,
            address,
            cart: cart_id,
            user_id: req.user._id.toString(),
            isplaced: true
        })
        cart.isChecked = true
        await cart.save()

        await order.populate('cart')
        await order.populate({ path: 'user_id', select: 'phone' })

        res.status(200).send({
            messege: {
                type: 'success',
                text: 'Order placed Successfully'
            },
            order
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).send({
            type: 'error',
            text: 'something went wrong'
        })
    }

})

router.use((req, res, next) => {
    if (!req.verifiedToken.isAdmin) {
        res.status(401).send({
            messege: 'Unauthorized',
        })
    }
    next()
})

router.get('/', async (req, res) => {
    try {
        const orders = await orderModel.find({}).populate('cart').populate({ path: 'user_id', select: 'phone' })
        console.log(orders);
        res.status(200).send({
            messege: 'orders fetched successfully',
            orders
        })
    } catch (err) {
        res.status(500).send({
            messege: 'failed to fetch cart'
        })
    }
})

router.put('/', async (req, res) => {
    const schema = Joi.object({
        order_id: Joi.string().required(),
        status: Joi.string().required(),
    })
    try {
        const { order_id, status } =
            await schema.validateAsync(req.body);

        const order = await orderModel.findByIdAndUpdate(order_id, { status }, { new: true })

        res.status(200).send({
            messege: {
                type: 'success',
                text: 'Order placed Successfully'
            },
            order
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).send({
            type: 'error',
            text: 'something went wrong'
        })
    }

})

export default router