import { Router } from 'express';
import categoryModel from '../models/categoryModel.mjs';
import { productModel } from '../models/productModel.mjs'
import { create_update_cart, update_cart } from '../controllers/cart.mjs';
import { place_order } from '../controllers/order.mjs';
import CONTROLLERS from '../controllers/export_controller.mjs'

const router = Router()

router.post('/', async (req, res) => {
    const body = req.body
    // console.log(body);
    const intentName = body.queryResult.intent.displayName
    const params = body.queryResult.parameters
    console.log(params);
    const session = body.session.split('/')
    const userId = session[session.length - 1]
    // const userId = body.originalDetectIntentRequest.payload.userId
    // console.log(userId);
    // console.log(body);
    console.log(intentName);
    // console.log(params);
    const contexts = body.queryResult.outputContexts
    let item, qty;
    const itemPrice = contexts.find(context => context.name.includes('item_price'));
    if (itemPrice) {
        item = itemPrice.parameters.product
        qty = itemPrice.parameters.quantity
    }

    let resposeData;
    const response = (msg, oc,) => {
        resposeData = {
            "fulfillmentMessages": [{ "text": { "text": [msg] } }],
            outputContexts: oc && contexts.map(context => context.name.includes(oc.name) ?
                { ...context, lifespanCount: oc.span } : context)
        }
        // if (outputContext.length > 0) {
        //     response['outputContexts'] = outputContext;
        // }
    }

    try {
        const productName = params.item || params.product || item
        const product = (productName) ? await productModel.findOne({
            title: {
                $regex: `${productName}`,
                $options: 'i'
            }
        }) : null

        if (intentName === 'productList' || intentName === 'orderItem - yes') {
            const categories = await categoryModel.find({})
            // console.log(categories);
            response(`we have different variety of products currently we have ${categories.map(category => ' ' + category.title)} which type of product do you want ?`)
        }
        if (intentName === 'productCategory') {
            const products = await productModel.find({
                category: {
                    $regex: `${params.category}`,
                    $options: 'i'
                }
            })
            response(`we have ${products.map(product => ' ' + product.title)}, what do you want to order?`)
        }
        if (intentName === 'orderItem' || intentName === 'itemPrice - order') {
            const quantity = params.qty || qty
            if (!quantity && product)
                response(`we have ${product.title} in ${product.unit_name} how many ${product.unit_name} do you want ?`,
                    intentName === 'itemPrice - order' && { name: 'item_price', span: 2 })
            else if (quantity) {
                if (product) {
                    await create_update_cart(product._id, quantity, userId)
                    response(`${quantity} ${product.unit_name.toLowerCase()} of ${product.title} has been added to cart, do you want to order other items?`, {
                        product: productName,
                        quantity: quantity
                    },
                    )
                }
                else response(`please tell me which product do you want to order`)
            }
        }
        if (intentName === 'orderItem - no') {
            response(`Do you want to checkout?`)
        }
        if (intentName === 'updateItem') {
            const quantity = params.qty || qty
            if (!product) return response(`please tell me which item do you want to update`)
            if (!quantity) return response(`how many units you want to update`)
            if (!params.intent) return response(`please tell me do want to remove item or add more items`)
            try {
                await update_cart(userId, product._id, params.qty, params.intent)
                response(`${params.qty} ${product.unit_name} of ${product.title} has been ${params.intent === 'increase' ? 'added' : 'removed'} ${params.intent === 'increase' ? 'in' : 'from'} cart`, { name: 'item_price', span: 0 })
            } catch (error) {
                response(`${error}`)
            }
        }
        if (intentName === 'itemPrice') {
            if (product) {
                !params.quantity ?
                    response(`${product.title} is ${product.unit_price} rs per ${product.unit_name.toLowerCase()}`) :
                    response(`${params.quantity} ${product.title} is ${product.unit_price * params.quantity} rs and 1 ${product.title} is  ${product.unit_price} rs per ${product.unit_name}`)
            } else response(`this product is not available`)
        }
        if (intentName === 'checkout_followup') {
            const cart = await CONTROLLERS.cart.get_cart(userId)
            response(`Ok ${params.name.name}. Your Total amount is ${cart.total} rs. Do you want to proceed with payment?`)
        } else if (intentName === 'payment') {
            const info = contexts.find(context => context.name.includes('get-info'));
            const { name, address } = info && info.parameters
            // console.log(name);
            const user = await CONTROLLERS.user.get_user(userId)
            const cart = await CONTROLLERS.cart.get_cart(user._id)
            const payment = info && await CONTROLLERS.payment.make_payment(params, { user, cart })
            if (payment) {
                await place_order(userId, name.name, address)
                response(`${payment.amount_received / 100} rs has been recieved from ${payment.receipt_email}`)
            } else {
                response(`I am really sorry i could not process your request, if you have any issue kindly contact saylani online support`)
            }
        }

    } catch (error) {
        console.log(error);
        response('something went wrong')
    }
    res.send(resposeData)

});

export default router