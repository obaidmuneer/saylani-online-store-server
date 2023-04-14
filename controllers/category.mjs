import categoryModel from "../models/categoryModel.mjs"

export const find_categories = async () => {
    return await categoryModel.find({})
}