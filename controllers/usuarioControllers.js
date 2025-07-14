//para aplicar el patron observer
import emitter from '../helpers/eventEmitter.js';
import { check, validationResult } from "express-validator";
import bcrypt from 'bcrypt';
import Usuario from "../models/Usuario.js";
import {generarJWT, generalId } from "../helpers/tokens.js";
import { emailRegistro, emaiLOlvidePassword } from "../helpers/emails.js";

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesion',
        csrfToken: req.csrfToken()
    })
}

const autenticar =async (req, res) => {
    //validacion
    await check('email').isEmail().withMessage('No tiene formato de Mail').run(req)
    await check('password').notEmpty().withMessage('El password es obligatorio').run(req)

    let resultado = validationResult(req)
    //verificacion de que el resultado este vacio
    // si hay errores se los envia a la vista
    if(!resultado.isEmpty()){
        return res.render('auth/login', {
        pagina: 'Iniciar Sesion',
        csrfToken : req.csrfToken(),
        errores: resultado.array(),
        })
    }

    const {email, password} = req.body
    //COMPROBAR SI EL USUARIO EXISTE
    const usuario = await Usuario.findOne({ where: {email}})
    if(!usuario){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesion',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario no existe'}]
        })
    }

    //confirmar si el usuario esta confirmado
    if(!usuario.confirmado){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesion',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'La cuenta no ha sido confirmada'}]
        })
    }

    //revisar el password
    // aplica el metodo de clase agregado en el prototype en el modelo usuario
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesion',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El password es incorrecto'}]
        })
    }

    //autenticamos el usuario
    const token = generarJWT(usuario.id)
    
    //PATRON OBSERVER  registra el inicio de secion del usuario
    emitter.emit('userLoggedIn', {
        email: email,
        nombre: usuario.nombre
    });

    //almacenar token en un acookie
    return res.cookie('_token', token,{
        httpOnly:true
    }).redirect('/mis-propiedades')

}

const formularioRegistro = (req, res) => {
    //va la vista que quiero renderizar y el obejo que quiero pasarle
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken : req.csrfToken()
    })
}

const registrar = async(req,res) => {
    //validacion, regresa un array con los errores
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacio').run(req)
    await check('email').isEmail().withMessage('No tiene formato de Mail').run(req)
    await check('password').isLength({ min:6 }).withMessage('El password tiene que tener mas de 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Los passwords no coinciden').run(req)

    let resultado = validationResult(req)
    //verificacion de que el resultado este vacio
    // si hay errores se los envia a la vista
    if(!resultado.isEmpty()){
        return res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken : req.csrfToken(),
        errores: resultado.array(),
        usuario: {
            nombre: req.body.nombre,
            email: req.body.email
        }
        })
    }

    //extraigo datos
    const { nombre, email, password } = req.body
    //verificar que el usuario no este duplicado en la base
    const existeUsuario = await Usuario.findOne( { where: {email : email}})
    if(existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario ya esta registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }
   
    // almaceno el usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generalId()
    })

    // enviar email de confirmacion
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de confirmacion
    res.render('templates/mensaje',{
        pagina: 'Cuenta creada',
        mensaje: ' Se envio un Email de confirmacion'
    })
}


//funcion que comprueba una cuenta
const confirmar = async(req, res) => {
    const { token }= req.params

    //verificar si el token es valido
    const usuario = await Usuario.findOne( { where: {token}})
    
    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Se produjo un error al intentar confirmar tu cuenta',
            mensaje: 'Intenta confirmar tu cuenta nuevamente',
            error:true
            
        })
    }

    //confirmar cuenta
    // ya obtuve el usuario de la base por token
    //ahora al objeto que obtuve vacio el token y cambio el estado a confirmado porque hizo click en el 
    //enlace enviado, luego guardo con el metodo de secualize
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'Su cuenta se confirmo correctamente'
            
    })
}


const formularioOlvidePasword = (req, res) => {
    //va la vista que quiero renderizar y el obejo que quiero pasarle
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu Acceso',
        csrfToken : req.csrfToken()
    })
}

const resetPassword = async(req, res) => {
    //validacion
    await check('email').isEmail().withMessage('No tiene formato de Mail').run(req)

    let resultado = validationResult(req)
    //verificacion de que el resultado este vacio
    // si hay errores se los envia a la vista
    if(!resultado.isEmpty()){
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu Acceso',
            csrfToken : req.csrfToken(),
            errores: resultado.array()
        })
    }

    //BUSCAR EL USUARIO
    const { email } = req.body

    const usuario = await Usuario.findOne( {where: { email}})
    if(!usuario){
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El Email no pertenece a un usuario registrado'}]
        })
    }

    //generar un token y enviar mail
    usuario.token = generalId()
    await usuario.save()

    //ENVIAR MAIL
    emaiLOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    // RENDERIZAR MSG
    return res.render('templates/mensaje', {
        pagina: 'Restablece tu password',
        mensaje:'Se envio un mail con las intrucciones'
    })

}

const comprobarToken = async (req, res) =>{
   const { token } = req.params

   const usuario = await Usuario.findOne({where: {token}})
   if (!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Restablece tu password',
            mensaje:'Hubo un error al restablecer tu password, vuelve a intentar',
            error: true
        })
   }

   //si todo esta ok mostramos el formulario
   res.render('auth/reset-password', {
        pagina: 'Restablece tu Password',
        csrfToken:req.csrfToken()
   })

}

const nuevoPassword = async(req, res) =>{
    await check('password').isLength({ min:6 }).withMessage('El password tiene que tener mas de 6 caracteres').run(req)
    
    let resultado = validationResult(req)
    //verificacion de que el resultado este vacio
    // si hay errores se los envia a la vista
    if(!resultado.isEmpty()){
        return res.render('auth/reset-password', {
            pagina: 'Cambia tu password',
            csrfToken : req.csrfToken(),
            errores: resultado.array()
        })
    }

    const { token }= req.params
    const { password } = req.body

    //Identificamos que usauario hace el cambio de pass
    const usuario = await Usuario.findOne({where: {token}})

    //hashear el nuevo password
    const salt= await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash( password, salt)
    usuario.token = null

    await usuario.save()

    res.render('auth/confirmar-cuenta',{
        pagina: 'Password reestablecido con exito!',
        mensaje: 'El password se guardo correctamente'
    })
}

export{
    formularioLogin,
    autenticar,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePasword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}