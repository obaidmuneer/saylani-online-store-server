import express from "express";
import Joi from 'joi'
import * as dotenv from 'dotenv'

import auth from "../middlewares/auth.mjs";
import { productModel } from '../models/productModel.mjs'
import { orderItemModel } from "../models/orderItemModel.mjs";
import cartModel from "../models/cartModel.mjs";

const router = express.Router()
dotenv.config()

router.use(auth)

router.get('/', async (req, res) => {
    try {
        const cart = await cartModel.find({ user_id: req.user._id })
        console.log(cart);
        res.status(200).send({
            messege: 'cart fetched successfully',
            cart
        })
    } catch (err) {
        res.status(500).send({
            messege: 'failed to fetch cart'
        })
    }
})

router.post('/', async (req, res) => {
    const schema = Joi.object({
        product_id: Joi.string().required(),
        quantity: Joi.number().required(),
        cart_id: Joi.string(),
    })
    try {
        const { product_id, quantity, cart_id } =
            await schema.validateAsync(req.body);
        const product = await productModel.findById(product_id, {}, { select: 'category file title unit_name unit_price _id' })
        // console.log(product);
        if (!product) throw new Error('Product not found')
        const priceByQuantity = product.unit_price * quantity
        const order = new orderItemModel({
            product: product,
            quantity,
            total: priceByQuantity,
        })
        // console.log(order);
        const cart = await cartModel.findById(cart_id)
        // const cart = await cartModel.findByIdAndUpdate(cart_id, {
        //     $addToSet: {
        //         'orders': order
        //     }
        // }, { new: true })            

        if (!cart) {
            const cart = await cartModel.create({
                user_id: req.user._id.toString(),
                orders: order,
                total: priceByQuantity
            })
            res.status(200).send({
                messege: 'product added to cart',
                cart
            })
            return
        }
        const productInOrder = await cartModel.findOne({ 'orders.product': product })
        console.log(productInOrder);
        if (!productInOrder) {
            cart.orders.push(order)
            await cart.save()
        }
        res.status(200).send({
            messege: 'product added to cart',
            cart
        })


    }
    catch (err) {
        console.log(err);
        res.status(400).send({
            messege: err.messege
        })
    }

})

router.put('/', async (req, res) => {
    const schema = Joi.object({
        order_id: Joi.string().required(),
        user_id: Joi.string().required(),
        product_id: Joi.string().required(),
        total: Joi.string().required(),
    })
    try {
        const { user_id, product_id, status, total } =
            await schema.validateAsync(req.body);
        const product = await productModel.findOne({ _id: product_id, isDeleted: false })
        const order = await orderItemModel.findOne({ status: 'pending', user_id, order_id, isDeleted: false })
        order.push(product._id.toString())
        order.total = total
        order.save()
        res.status(200).send({
            messege: 'category added successfully',
            category
        })
    } catch (err) {
        res.status(500).send({
            messege: 'failed to fetch docs'
        })
    }
})

router.delete('/:id', async (req, res) => {
    const schema = Joi.object({
        user_id: Joi.string().required(),
        order_id: Joi.string().required(),
        product_id: Joi.string().required(),
    })
    try {
        const { user_id, product_id } =
            await schema.validateAsync(req.body);
        const order = await orderItemModel.findOne({ _id: order_id, user_id, isDeleted: false })
        order = order.filter(eachOrder => eachOrder.toString() !== product_id)
        await order.save()
        res.status(200).send({
            messege: 'product removed successfully',
            order
        })
    }
    catch (err) {
        console.log(err);
        res.status(400).send({
            messege: err.messege
        })
    }
})

router.delete('/', async (req, res) => {
    const schema = Joi.object({
        order_id: Joi.string().required(),
    })
    try {
        const { order_id } = await schema.validateAsync({
            order_id: req.body.order_id,
        });
        await orderItemModel.deleteOne({ order_id })
        res.status(200).send({
            messege: 'doc deleted successfully',
        })
    }
    catch (err) {
        res.status(400).send({
            messege: err.messege
        })
    }
})

export default router