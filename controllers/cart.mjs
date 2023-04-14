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

export const get_cart = async (userId) => {
    const cart = await cartModel.findOne({ user_id: userId, isChecked: false })
    // if (!cart) throw new Error('Cart not found')
    return cart
}

export const create_update_cart = async (productId, quantity, userId) => {
    try {
        const product = await productModel.findById(productId, {}, { select: 'category file title unit_name unit_price' })
        if (!product) throw new Error('Product not found')

        const priceOfProduct = product.unit_price * quantity
        const order = new orderItemModel({
            product: { ...product, id: productId },
            quantity,
            total: priceOfProduct,
        })
        const cart = await cartModel.findOne({ user_id: userId, isChecked: false })

        if (!cart) {
            const cart = await cartModel.create({
                user_id: userId,
                orders: order,
                total: priceOfProduct
            })
            return cart
        }

        const itemIndex = cart.orders.findIndex(order => order.product._id.toString() == productId.toString())

        if (itemIndex > -1) {
            const produtPrice = +cart.orders[itemIndex].product.unit_price * quantity
            cart.orders[itemIndex].quantity += quantity
            cart.orders[itemIndex].total += produtPrice
            cart.total += produtPrice
        } else {
            cart.orders.push(order)
            cart.total += priceOfProduct
        }
        await cart.save()
        return cart
    } catch (error) {
        throw 'Something went wrong'
    }
}

export const update_cart = async (userId, productId, quantity, intent) => {
    try {
        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) throw new Error('Product not found')

        const cart = await cartModel.findOne({ user_id: userId, isChecked: false })
        if (!cart) throw new Error('Cart not found')

        const item = cart.orders.find(order => order.product._id.toString() == productId.toString())
        if (!item) throw new Error('Item not found')
        // console.log(item);
        const productPrice = +item.product.unit_price * quantity
        if (quantity && intent === 'increase') {
            item.quantity += quantity
            item.total += productPrice
            cart.total += productPrice
        } else if (quantity && intent === 'decrease') {
            if (item.quantity > 1 && (item.quantity - quantity) > 0) {
                item.quantity -= quantity
                item.total -= productPrice
                cart.total -= productPrice
            } else {
                throw new Error('Item Quantity cannot be less than 1')
            }
        }
        await cart.save()

        return cart

    } catch (error) {
        throw error.message
    }
}