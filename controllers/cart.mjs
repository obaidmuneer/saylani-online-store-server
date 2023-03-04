import cartModel from "../models/cartModel.mjs";
import { orderItemModel } from "../models/orderItemModel.mjs";
import { productModel } from "../models/productModel.mjs";

// export const find_cart = async (userId) => {
//     const cart = await cartModel.find({ user_id: userId, isChecked: false });
//     return cart
// }

// export const create_cart = async (userId, order, priceOfProduct) => {
//     const cart = await cartModel.create({
//         user_id: userId,
//         orders: order,
//         total: priceOfProduct
//     })
//     return cart
// }

// export const update_cart = async (cart, product_id) => {
//     // console.log(cart);
//     // const itemIndex = cart.orders.findIndex(order => order.product._id == product_id)

//     // if (itemIndex > -1) {
//     //     const produtPrice = +cart.orders[itemIndex].product.unit_price
//     //     cart.orders[itemIndex].quantity += 1
//     //     cart.orders[itemIndex].total += produtPrice
//     //     cart.total += produtPrice
//     // } else {
//     //     cart.orders.push(order)
//     //     cart.total += priceOfProduct
//     // }
//     // await cart.save()
//     // return itemIndex
// }

export const create_update_cart = async (productId, quantity, usedId) => {
    const product = await productModel.findById(productId, {}, { select: 'category file title unit_name unit_price' })
    if (!product) throw new Error('Product not found')

    const priceOfProduct = product.unit_price * quantity
    const order = new orderItemModel({
        product: { ...product, id: productId },
        quantity,
        total: priceOfProduct,
    })
    const cart = await cartModel.findOne({ user_id: usedId, isChecked: false })

    if (!cart) {
        const cart = await cartModel.create({
            user_id: usedId,
            orders: order,
            total: priceOfProduct
        })
        return cart
    }
    const itemIndex = cart.orders.findIndex(order => order.product._id == productId)

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
    return cart
}