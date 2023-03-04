import { Router } from 'express';
import categoryModel from '../models/categoryModel.mjs';
import { productModel } from '../models/productModel.mjs'
import { create_update_cart } from '../controllers/cart.mjs';
import { place_order } from '../controllers/order.mjs';

const router = Router()

router.post('/', async (req, res) => {
    const body = req.body
    const intentName = body.queryResult.intent.displayName
    const params = body.queryResult.parameters
    const userId = body.originalDetectIntentRequest.payload.userId
    console.log(userId);
    console.log(intentName);
    console.log(params);
    const context = body.queryResult.outputContexts
    // console.log(body.responseId);

    const response = (msg) => {
        return res.send({
            "fulfillmentMessages": [
                {
                    "text": {
                        "text": [
                            msg
                        ]
                    }
                }
            ]
        })
    }

    try {
        const product = (params.item || context[1]?.parameters?.item) ? await productModel.findOne({
            title: {
                $regex: params.item || context[1].parameters.item,
                $options: 'i'
            }
        }) : null

        if (intentName === 'productList' || intentName === 'orderItem - yes') {
            const categories = await categoryModel.find({})
            response(`we have different variety of products currently we have ${categories.map(category => ' ' + category.title)} which type of product do you want ?`)
        }
        if (intentName === 'productCategory') {
            const products = await productModel.find({
                category: {
                    $regex: `${params.category}`,
                    $options: 'i'
                }
            })
            response(`currently we have ${products.map(product => ' ' + product.title)} which product do you want to order ?`)
        }
        if (intentName === 'orderItem') {
            if (!params.qty && product)
                response(`we have ${product.title} in ${product.unit_name} how many ${product.unit_name} do you want ?`)
            else if (params.qty) {
                if (params.item) {
                    const cart = (userId) && await create_update_cart(product._id, params.qty, userId)
                    if (cart)
                        response(`${params.qty} ${product.unit_name} ${params.item} has been added to cart, do you want to order other items?`)
                }
                else response(`please tell me which product do you want to order`)
            }
        }
        if (intentName === 'orderItem - no') {
            response(`Do you want to checkout?`)
        }
        if (intentName === 'itemPrice') {
            if (product)
                !params.qty ?
                    response(`the price of the ${product.title} is ${product.unit_price} in ${product.unit_name}`) :
                    response(`the price of the ${params.qty} ${product.title} is ${product.unit_price * params.qty} rs and 1 ${product.title} is  ${product.unit_price} in ${product.unit_name}`)
            else
                response(`this product is not available`)
        }
        if (intentName === 'checkout') {
            // console.log(context[1].parameters);
            place_order(userId, params.name.name, params.address)
            response(`your order is one the way ${params.name.name}`)

        }
    } catch (error) {
        console.log(error);
        response('soemthing went wrong')
    }

});

export default router