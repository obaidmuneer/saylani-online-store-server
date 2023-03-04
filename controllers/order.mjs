import cartModel from "../models/cartModel.mjs"
import orderModel from "../models/orderModel.mjs"

export const place_order = async (userId, name, address) => {
    try {
        const cart = await cartModel.findOne({ user_id: userId, isChecked: false })
        if (!cart) throw new Error('Cart not found')
        const order = await orderModel.create({
            name,
            address,
            cart: cart._id,
            user_id: userId,
            isplaced: true
        })
        cart.isChecked = true
        await cart.save()

        await order.populate('cart')
        await order.populate({ path: 'user_id', select: 'phone' })

        return order
    }
    catch (err) {
        console.log(err);
        return err
    }

}
