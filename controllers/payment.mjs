import stripe from '../helpers/stripe.mjs'

export const make_payment = async (params, user_data) => {
    const { card_number: number, exp_month, exp_year, cvc } = params
    const { user, cart } = user_data
    // console.log(user_data);
    console.log(user, cart);
    try {
        const customer = await stripe.customers.create({
            metadata: {
                user_id: user._id.toString(),
                cart_id: cart._id.toString()
            },
        });

        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                number,
                exp_month,
                exp_year,
                cvc,
            }
        });
        const paymentIntent = await stripe.paymentIntents.create({
            payment_method: paymentMethod.id,
            amount: cart.total * 100, // USD*100 //Amount must convert to at least 50 cents.
            currency: 'pkr',
            confirm: true,
            payment_method_types: ['card'],
            receipt_email: user.email, //req.body.email
            customer: customer.id
        });

        return paymentIntent
    } catch (error) {
        console.log(error);
        return error.message
    }
}

// export default { make_payment }
