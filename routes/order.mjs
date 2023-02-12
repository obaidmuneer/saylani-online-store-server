import express from "express";
import Joi from 'joi'
import * as dotenv from 'dotenv'

import auth from "../middlewares/auth.mjs";
import productModel from '../models/productModel.mjs'
import orderModel from "../models/orderModel.mjs";

const router = express.Router()
dotenv.config()

express().use(auth)

router.get('/', async (req, res) => {
    console.log(req.query);
    const page = req.query.page || 0
    try {
        const order = await orderModel.find({ user_id: req.user._id }, {}, {
            sort: { '_id': -1 },
            limit: 40,
            skip: page
        })
        res.status(200).send({
            messege: 'docs fetched successfully',
            order
        })
    } catch (err) {
        res.status(500).send({
            messege: 'failed to fetch docs'
        })
    }
})

express().use(auth)

router.post('/', async (req, res) => {
    const schema = Joi.object({
        user_id: Joi.string().required(),
        product_id: Joi.string().required(),
        total: Joi.string().required(),
    })
    try {
        const { user_id, product_id, total } =
            await schema.validateAsync(req.body);
        const order = await orderModel.create({
            user_id,
            product_id,
            total,
            ip: req.ip
        })
        res.status(200).send({
            messege: 'order added added successfully',
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
        const order = await orderModel.findOne({ status: 'pending', user_id, order_id, isDeleted: false })
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
        const order = await orderModel.findOne({ _id: order_id, user_id, isDeleted: false })
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
        await orderModel.deleteOne({ order_id })
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