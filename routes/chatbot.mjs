import { Router } from 'express';
import CONTROLLERS from '../controllers/export_controller.mjs'
import UTILS from '../helpers/utils.mjs';

const router = Router()

router.post('/', async (req, res) => {
    const body = req.body
    const intentName = body.queryResult.intent.displayName
    const params = body.queryResult.parameters
    console.log(params);
    console.log(intentName);
    const session = body.session.split('/')
    const userId = session[session.length - 1]
    // const userId = body.originalDetectIntentRequest.payload.userId // used
    const contexts = body.queryResult.outputContexts
    const item_price = `${body.session}/contexts/item_price`;
    const get_info = `${body.session}/contexts/get-info`;

    let item, qty;
    const itemPrice = contexts.find(context => context.name.includes('item_price'));
    if (itemPrice) {
        item = itemPrice.parameters.product
        qty = itemPrice.parameters.quantity
    }

    let resData = {};

    try {
        const productName = params.item || params.product || item;
        const product = productName && (await CONTROLLERS.product.find_product('title', productName));

        let resData;
        switch (intentName) {
            case 'productList':
            case 'orderItem - yes':
                const categories = await CONTROLLERS.find_categories();
                resData = UTILS.response(`we have different variety of products currently we have ${categories.map(category => ' ' + category.title)} which type of product do you want ?`);
                break;

            case 'productCategory':
                const products = productName && (await CONTROLLERS.product.find_product('category', params.category));
                resData = UTILS.response(`we have ${products.map(product => ' ' + product.title)}, what do you want to order?`);
                break;

            case 'orderItem':
            case 'itemPrice - order':
                const orderQuantity = params.qty || qty;
                if (!orderQuantity && product)
                    resData = UTILS.response(`we have ${product.title} in ${product.unit_name} how many ${product.unit_name} do you want ?`,
                        intentName === 'itemPrice - order' && { name: item_price, lifespanCount: 2, });
                else if (orderQuantity) {
                    if (product) {
                        await CONTROLLERS.cart.create_update_cart(product._id, orderQuantity, userId);
                        resData = UTILS.response(`${orderQuantity} ${product.unit_name.toLowerCase()} of ${product.title} has been added to cart, do you want to order other items?`);
                    } else
                        resData = UTILS.response(`please tell me which product do you want to order`);
                }
                break;

            case 'orderItem - no':
                resData = UTILS.response(`Do you want to checkout?`);
                break;

            case 'updateItem':
                const updateQuantity = params.qty || qty;
                const action = params?.intent === 'increase' ? 'added' : 'removed';

                if (!params.intent)
                    resData = UTILS.response(`please tell me do you want to remove item or add more items`);
                else if (!product)
                    resData = UTILS.response(`please tell me which item do you want to update`);
                else if (!updateQuantity)
                    resData = UTILS.response(`how many ${product.unit_name.toLowerCase()} you want to ${params.intent}`);
                else {
                    await CONTROLLERS.cart.update_cart(userId, product._id, params.qty, params.intent);
                    resData = UTILS.response(`${params.qty} ${product.unit_name.toLowerCase()} of ${product.title} has been ${action} ${params?.intent === 'increase' ? 'in' : 'from'} cart`, {
                        name: item_price,
                        lifespanCount: 0,
                    });
                }
                break;

            case 'itemPrice':
                if (product) {
                    !params.quantity ?
                        resData = UTILS.response(`${product.title} is ${product.unit_price} rs per ${product.unit_name.toLowerCase()}`) :
                        resData = UTILS.response(`${params.quantity} ${product.title} is ${product.unit_price * params.quantity} rs and 1 ${product.title} is  ${product.unit_price} rs per ${product.unit_name}`);
                } else
                    resData = UTILS.response(`this product is not available`);
                break;

            case 'checkout':
                const cart = await CONTROLLERS.cart.get_cart(userId);
                console.log(cart);
                if (cart) {
                    resData = UTILS.response(`Do you want to checkout`);
                } else {
                    resData = UTILS.response(`Your cart is empty. Please add items to your cart before placing an order.`, { name: get_info, lifespanCount: 0 });
                }
                break;

            case 'checkout_followup':
                const userCart = await CONTROLLERS.cart.get_cart(userId);
                if (userCart && userCart.total > 0) {
                    resData = UTILS.response(`Ok ${params.name.name}. Your Total amount is ${userCart.total} rs. Do you want to place the order?`);
                } else {
                    resData = UTILS.response(`Your cart is empty. Please add items to your cart before placing an order.`, { name: get_info, lifespanCount: 0 });
                }

            case 'payment':
                const info = contexts.find(context => context.name.includes('get-info'));
                const { name, address } = info && info.parameters
                // console.log(name);
                const user = await CONTROLLERS.user.get_user(userId)
                const cartPay = await CONTROLLERS.cart.get_cart(user._id)
                const payment = info && await CONTROLLERS.payment.make_payment(params, { user, cart: cartPay })
                if (payment) {
                    await CONTROLLERS.order.place_order(userId, name.name, address)
                    resData = UTILS.response(`${payment.amount_received / 100} rs has been recieved from ${payment.receipt_email}`, { name: get_info, lifespanCount: 0 })
                } else {
                    resData = UTILS.response(`I am really sorry i could not process your request, if you have any issue kindly contact saylani online support`)
                }
                break;

            default:
                resData = UTILS.response(`I'm sorry, I didn't understand that. Can you please rephrase or provide more information?`);
                break;
        }

        res.send(resData);
        
    } catch (error) {
        console.error(error);
        UTILS.response(`Oops! Something went wrong. Please try again later.`);
        res.send(resData);
    }
});

export default router