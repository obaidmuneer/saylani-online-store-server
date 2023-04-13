import storeUserModel from "../models/storeUserModel.mjs"

export const get_user = async (userId) => {
    const user = await storeUserModel.findOne({ _id: userId }, {}, {
        select: 'firstName lastName email phone isAdmin'
    })
    if (!user) throw new Error('User not found')
    return user
}