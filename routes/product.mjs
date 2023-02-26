import express from "express";
import Joi from 'joi'
import fs from 'fs'
import * as dotenv from 'dotenv'

import bucket from "../firebase/index.mjs";
import upload from "../middlewares/multerConfig.mjs";
import { productModel } from '../models/productModel.mjs'
import auth from "../middlewares/auth.mjs";
import categoryModel from "../models/categoryModel.mjs";
import admin from "../middlewares/admin.mjs";

const router = express.Router()
dotenv.config()

router.get('/', async (req, res) => {
    try {
        const products = await productModel.find({}, {}, {
            sort: { '_id': -1 },
        })
        res.status(200).send({
            messege: 'docs fetched successfully',
            products
        })
    } catch (err) {
        res.status(500).send({
            messege: 'failed to fetch docs'
        })
    }
})

router.get('/search', async (req, res) => {
    req.query.search
    try {
        const products = await productModel.find({
            title: {
                $regex: req.query.search,
                // $regex: `^${req.query.search}`,
                $options: 'i'
            },
        }, {}, {
            sort: { '_id': -1 },
        })
        res.status(200).send({
            messege: 'docs fetched successfully',
            products
        })
    } catch (err) {
        res.status(500).send({
            messege: 'failed to fetch docs'
        })
    }
})

router.get('/:category', async (req, res) => {
    const page = req.query.page || 0
    try {
        const products = await productModel.find({ category: req.params.category, isDeleted: false }, {}, {
            sort: { '_id': -1 },
            limit: 40,
            skip: page
        })
        res.status(200).send({
            messege: 'docs fetched successfully',
            products
        })
    } catch (err) {
        res.status(500).send({
            messege: 'failed to fetch docs'
        })
    }
})

router.use(auth)
router.use(admin)

router.post('/', upload.any(), async (req, res) => {
    const schema = Joi.object({
        // file: Joi.binary().required(),
        title: Joi.string().required(),
        category: Joi.string().required(),
        description: Joi.string().required(),
        unit_name: Joi.string().required(),
        unit_price: Joi.string().required(),
    })
    // console.log(req.body, req.files[0]);
    try {
        const { title, category, description, unit_name, unit_price } =
            await schema.validateAsync(req.body);
        bucket.upload(
            req.files[0].path,
            {
                destination: `saylaniStore/${req.files[0].filename}`, // give destination name if you want to give a certain name to file in bucket, include date to make name unique otherwise it will replace previous file with the same name
            },
            function (err, file, apiResponse) {
                if (!err) {
                    file.getSignedUrl({
                        action: 'read',
                        expires: '03-09-2999'
                    }).then(async (urlData, err) => {
                        if (!err) {
                            // console.log("public downloadable url: ", urlData[0]) // this is public downloadable url 
                            try {
                                fs.unlinkSync(req.files[0].path)
                                //file removed
                            } catch (err) {
                                console.error(err)
                            }
                            // console.log(urlData);
                            const product = await productModel.create({
                                file: urlData[0],
                                fileName: req.files[0].filename,
                                title,
                                category,
                                description,
                                unit_name,
                                unit_price,
                                ip: req.ip
                            })
                            res.status(200).send({
                                messege: 'product added successfully',
                                product
                            })
                        }
                    })
                } else {
                    console.log("err: ", err)
                    res.status(500).send();
                }
            });
    }
    catch (err) {
        console.log(err);
        res.status(400).send({
            messege: err.messege
        })
    }

})

router.delete('/:id', async (req, res) => {
    const schema = Joi.object({
        id: Joi.string().required(),
    })
    try {
        const { id } = await schema.validateAsync({ id: req.params.id });
        const product = await docModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true })
        res.status(200).send({
            messege: 'doc deleted successfully',
            product
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
        category: Joi.string().required(),
    })
    try {
        const { category } = await schema.validateAsync({
            category: req.body.category,
        });
        await productModel.deleteMany({ category }, { new: true })
        const products = await productModel.find({ category, isDeleted: false })
        res.status(200).send({
            messege: 'doc deleted successfully',
            products
        })
    }
    catch (err) {
        res.status(400).send({
            messege: err.messege
        })
    }
})

export default router