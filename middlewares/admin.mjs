const admin = (req, res, next) => {
    if (!req.verifiedToken.isAdmin) {
        return res.status(401).send({
            messege: 'Unauthorized Bad Request',
        })
    }
    next()
}
export default admin