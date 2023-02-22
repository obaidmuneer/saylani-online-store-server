import express from "express";
import Joi from 'joi'
import * as dotenv from 'dotenv'

import auth from "../middlewares/auth.mjs";
import { productModel } from '../models/productModel.mjs'
import { orderItemModel } from "../models/orderItemModel.mjs";
import cartModel from "../models/cartModel.mjs";
import orderModel from "../models/orderModel.mjs";

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

        const priceOfProduct = product.unit_price * quantity
        const order = new orderItemModel({
            product: { ...product, id: product_id },
            quantity,
            total: priceOfProduct,
        })
        const cart = await cartModel.findOne({ user_id: req.user._id, isChecked: false })

        if (!cart) {
            const cart = await cartModel.create({
                user_id: req.user._id.toString(),
                orders: order,
                total: priceOfProduct
            })
            return res.status(200).send({
                messege: {
                    type: 'success',
                    text: 'Product Added to Cart Successfully'
                },
                cart
            })

        }
        const itemIndex = cart.orders.findIndex(order => order.product._id == product_id)

        if (itemIndex > -1) {
            const produtPrice = +cart.orders[itemIndex].product.unit_price
            cart.orders[itemIndex].quantity += 1
            cart.orders[itemIndex].total += produtPrice
            cart.total += produtPrice
        } else {
            cart.orders.push(order)
            cart.total += priceOfProduct
        }
        await cart.save()
        res.status(200).send({
            messege: {
                type: itemIndex > -1 ? 'warning' : 'success',
                text: itemIndex > -1 ? 'Product is updated in Cart' : 'Product Added to Cart Successfully'
            },
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

router.post('/place', async (req, res) => {
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
        await orderModel.create({
            name,
            address,
            cart: cart_id,
            user_id: req.user._id.toString(),
            isplaced: true
        })
        cart.isChecked = true
        await cart.save()


        res.status(200).send({
            messege: {
                type: 'success',
                text: 'Order placed Successfully'
            },
            cart
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

router.put('/', async (req, res) => {
    const schema = Joi.object({
        cart_id: Joi.string().required(),
        product_id: Joi.string().required(),
        quantity: Joi.number().required(),
    })
    try {
        const { product_id, cart_id, quantity } =
            await schema.validateAsync(req.body);
        const product = await productModel.findOne({ _id: product_id, isDeleted: false })
        if (!product) return res.status(404).send({ message: 'Product not found' })

        const cart = await cartModel.findById(cart_id)
        if (!cart) return res.status(404).send({ message: 'Cart not found' })

        const item = cart.orders.find(order => order.product._id == product_id)
        if (!item) return res.status(404).send({ message: 'ordered item is not found in cart' })
        // console.log(item);
        const productPrice = +item.product.unit_price
        if (quantity) {
            item.quantity += 1
            item.total += productPrice
            cart.total += productPrice
        } else if (quantity === 0) {
            if (item.quantity > 1) {
                item.quantity -= 1
                item.total -= productPrice
                cart.total -= productPrice
            } else {
                return res.status(406).send({
                    messege: {
                        type: 'info',
                        text: 'quantity can not be less then 1'
                    }
                })
            }
        }
        await cart.save()

        res.status(200).send({
            messege: {
                type: 'success',
                text: 'quantity updated successfully'
            },
            cart
        })
    } catch (err) {
        console.log(err);
        res.status(500).send({
            messege: 'something went wrong',
        })
    }
})

router.delete('/:cartId', async (req, res) => {
    // console.log(req.params);
    const schema = Joi.object({
        cartId: Joi.string().required(),
    })
    try {
        const { cartId } =
            await schema.validateAsync(req.params);
        // console.log(cartId);
        await cartModel.findOneAndRemove({ _id: cartId, user_id: req.user._id, isChecked: false })
        res.status(200).send({
            messege: {
                type: 'success',
                text: 'cart deleted successfully'
            }
        })
    }
    catch (err) {
        console.log(err.message);
        res.status(400).send({
            messege: {
                type: 'error',
                text: 'something went wrong'
            }
        })
    }
})

export default router