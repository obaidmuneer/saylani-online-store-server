import { productModel } from "../models/productModel.mjs"

export const find_product = async (filter_key, filter_value) => {
    return await productModel.findOne({
            [filter_key]: {
                $regex: `${filter_value}`,
                $options: 'i'
            }
        })
}