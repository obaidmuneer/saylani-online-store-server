import express from "express";
import Joi from "joi";
import bucket from "../firebase/index.mjs";
import auth from "../middlewares/auth.mjs";
import upload from "../middlewares/multerConfig.mjs";
import categoryModel from "../models/categoryModel.mjs";
import fs from 'fs';
import admin from "../middlewares/admin.mjs";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const category = await categoryModel.find({}, {}, {
            sort: { 'title': 1 },
        })
        res.status(200).send({
            message: 'category fetched successfully',
            category
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'something went wrong' })
    }
})

router.post('/', [auth, admin, upload.any()], async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().required(),
    })
    if (!req.verifiedToken.isAdmin) {
        res.status(401).send({
            message: 'Unauthorized access'
        })
        return
    }
    try {
        const { title } = await schema.validateAsync(req.body)
        bucket.upload(
            req.files[0].path,
            {
                destination: `saylaniStore/category/${req.files[0].filename}`,
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
                            const postedCategory = await categoryModel.create({
                                title,
                                file: urlData[0],
                                fileName: req.files[0].filename,
                                ip: req.ip
                            })
                            res.status(200).send({
                                message: 'category fetched successfully',
                                category: postedCategory
                            })
                        }
                    })
                } else {
                    console.log("err: ", err)
                    res.status(500).send();
                }
            });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'something went wrong' })
    }
})

export default router