import express from "express";
import paymentModel from "../models/paymentModel.mjs";
import Joi from 'joi'

const router = express.Router()

router.post('/', async (req, res) => {
    // const schema = Joi.object({
    //     cart_id: Joi.string().required(),
    //     payment_id: Joi.string().required(),
    // })
    try {
        // const { cart_id, payment_id } =
        //     await schema.validateAsync(req.body);
        const payment = await paymentModel.find({ payment_id: req.body.payment_id }).exec()
        console.log(payment);
        if (!payment) return res.status(404).send({
            messege: {
                type: 'error',
                text: 'Payment detail not found'
            }
        })
        console.log(payment);

        res.status(200).send({
            messege: {
                type: 'success',
                text: 'Payment details found'
            },
            payment
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