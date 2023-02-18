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
        const product = await productModel.findById(product_id, {}, { select: 'category file title unit_name unit_price' })
        // console.log(product);
        if (!product) throw new Error('Product not found')
        const priceByQuantity = product.unit_price * quantity
        const order = new orderItemModel({
            product: { ...product, id: product_id },
            quantity,
            total: priceByQuantity,
        })
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
                messege: {
                    type: 'success',
                    text: 'Product Added to Cart Successfully'
                },
                cart
            })
            return
        }
        const productInOrder = await cartModel.findOne({ 'orders.product': product })
        // console.log(cart);
        if (!productInOrder) {
            cart.orders.push(order)
            cart.total += priceByQuantity
            await cart.save()
        }
        res.status(200).send({
            messege: {
                type: productInOrder ? 'warning' : 'success',
                text: productInOrder ? 'Product is already in Cart' : 'Product Added to Cart Successfully'
            },
            cart
        })
    }
    catch (err) {
        // console.log(err);
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
        cart_id: Joi.string().required(),
    })
    try {
        const { cart_id } =
            await schema.validateAsync(req.params);
        const cart = await cartModel.findOneAndRemove({ _id: cart_id, user_id: req.user._id })
        res.status(200).send({
            messege: 'cart removed successfully',
        })
    }
    catch (err) {
        console.log(err);
        res.status(400).send({
            messege: err.messege
        })
    }
})

export default router