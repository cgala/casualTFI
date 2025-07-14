import jwt from'jsonwebtoken'
import { Usuario } from '../models/index.js'

const protegerRuta = async (req, res, next) => {
    
    // verificamos si hay un token
    const { _token } = req.cookies
    if(!_token){
        return res.redirect('/auth/login')
    }

    //comprobamos el token
    try {
        const decoded = jwt.verify(_token, process.env.JWT_SECRET)
        const usuario = await Usuario.scope('eliminarPassword').findByPk(decoded.id)

        //almaceno el usuario al request para que este disponible en otros req
        if(usuario) {
            req.usuario = usuario
        } else {
            return res.redirect('/auth/login')
        }
        return next();

    } catch (error) {
        return res.clearCookie('_token').redirect('/auth/login')
    }

    next();
}

export default protegerRuta