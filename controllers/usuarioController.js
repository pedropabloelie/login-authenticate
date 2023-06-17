import {check, validationResult} from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from "../models/Usuario.js"
import { generarId, generarJWT } from '../helpers/tokens.js'
import { emailRegistro, emailRecoverPassword } from '../helpers/email.js'


const formularioLogin = (req, res) =>{
    res.render('auth/login', {
        pagina : 'Iniciar Sesión',
        csrfToken : req.csrfToken(),
    })
}

const formAuthenticate = async (req, res) =>{

    const { email, password} = req.body

    await check('email').isEmail().withMessage('El email es obligatorio').run(req)
    await check('password').notEmpty().withMessage('El password es obligatorio').run(req)

    let resultado = validationResult(req)

    // Verificar que el resultado no este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/login', {
            pagina : 'Iniciar Sesión',
            csrfToken : req.csrfToken(),
            errores: resultado.array(),
        })
    }

    // Verificar si el usuario existe
    const usuario = await Usuario.findOne({ where : { email}})

    if (!usuario) {
        return res.render('auth/login', {
            pagina : 'Iniciar Sesión',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario no existe'}]
        })
    }

    // Comprobar si el usuario esta confirmado
    if (!usuario.confirmado) {
        return res.render('auth/login', {
            pagina : 'Iniciar Sesión',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'Tu cuenta no ha sido confirmada'}]
        })
    }

    // Comprobar password
    if (!usuario.verificarPassword(password)) {
        return res.render('auth/login', {
            pagina : 'Iniciar Sesión',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El password es incorrecto'}]
        })
    }

    // Generar JWT
    const token = generarJWT(usuario.id)

    // Almacenar en un cookie
    return res.cookie('_token', token, {
        httpOnly: true,
        // secure: true,
        // sameSite: true
    }).redirect('/my-properties')
}

const formularioRegister = (req, res) =>{
    res.render('auth/register', {
        pagina : 'Crear Cuenta',
        csrfToken : req.csrfToken()
    })
}

const register = async (req, res) =>{

    const {nombre, email, password} = req.body

    // Validar
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacio').run(req)
    await check('email').isEmail().withMessage('Esto no parece un Email').run(req)
    await check('password').isLength({min: 6}).withMessage('El password debe ser de al menos 6 caracteres').run(req)
    await check('repetir_password').equals(password).withMessage('Los passwords no son iguales.').run(req)

    let resultado = validationResult(req)

    // Verificar que el resultado no este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/register', {
            pagina : 'Crear Cuenta',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario ya esta registrado'}],
            usuario: {
                nombre,
                email
            }
        })
    }

    // Verificar que el resultado no este duplicado
    const existeUsuario = await Usuario.findOne({where : { email }})

    if (existeUsuario) {
        return res.render('auth/register', {
            pagina : 'Crear Cuenta',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario ya esta registrado'}],
            usuario: {
                nombre,
                email
            }
        })
    }

    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    // Enviar Email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email:usuario.email,
        token:usuario.token
    })

    // res.json(usuario)
    // Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina:'Cuenta creada correctamente.',
        mensaje:'Hemos enviado un Email de confirmación.'
    })
}

const confirm = async (req, res) => {

    const {token} = req.params

    // Verificar si el token esvalido
    const usuario = await Usuario.findOne( { where : { token: token } })

    if (!usuario) {
        res.render('auth/confirm-account', {
            pagina:'Error al confirmar tu cuenta.',
            mensaje:'Hubo un error al confirma tu cuenta, intenta de nuevo.',
            error: true
        })
    }
    
    // Confirmar la cuenta
    usuario.token = null
    usuario.confirmado = true
    await usuario.save()

    res.render('auth/confirm-account', {
        pagina:'Cuenta confirmada.',
        mensaje:'La cuenta se confirmo correctamente.',
        error: false 
    })
}

const recoverPassword = (req, res) =>{
    res.render('auth/recover-password', {
        pagina : 'Recuperar Password',
        csrfToken : req.csrfToken(),
    })
}

const resetPassword = async (req, res) =>{

    // Validación
    await check('email').isEmail().withMessage('Esto no parece un Email').run(req)

    let resultado = validationResult(req)

    // Verificar que el resultado no este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/recover-password', {
            pagina : 'Recupera tu acceso a Bienes Raices',
            csrfToken : req.csrfToken(),
            errores: resultado.array()
        })
    }

    // Si es valido el correo, Buscamos el usuario.
    const {email} = req.body

    const usuario = await Usuario.findOne({ where: {email}})

     // Verificar que el resultado no este vacio
     if (!usuario) {
        return res.render('auth/recover-password', {
            pagina : 'Recupera tu acceso a Bienes Raices',
            csrfToken : req.csrfToken(),
            errores: [{ msg: 'El email no pertenece a ningun usuario'}]
        })
    }

    // Si existe, generamos un nuevo token
    usuario.token = generarId()
    await usuario.save()

    // Enviar Email
    emailRecoverPassword({
        nombre: usuario.nombre,
        email:usuario.email,
        token:usuario.token
    })

    // Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina:'Reestablece tu password.',
        mensaje:'Hemos enviado un Email con las instrucciones.'
    })


}

const verifyPassword = async (req, res) => {
    const {token} = req.params

    // Verificar si el token
    const usuario = await Usuario.findOne( { where : { token: token } })

    if (!usuario) {
        res.render('auth/confirm-account', {
            pagina:'Reestablece tu password.',
            mensaje:'Hubo un error al validar tu información, intenta de nuevo.',
            csrfToken : req.csrfToken(),
            error: true
        })
    }

    // Si el token es valido mostramos el formulario para modificar el password
    res.render('auth/reset-password', {
        pagina:'Reestablece tu password.',
        csrfToken : req.csrfToken()
    })
}

const newPassword = async (req, res) => {
 
    const {password} = req.body
    const {token} = req.params

    // Validar el password
    await check('password').isLength({min: 6}).withMessage('El password debe ser de al menos 6 caracteres').run(req)

    let resultado = validationResult(req)

    // Verificar que el resultado no este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/reset-password', {
            pagina : 'Restablece tu password',
            csrfToken : req.csrfToken(),
            errores: resultado.array(),
        })
    }

    // Identificar quien hizo el cambio
    const usuario = await Usuario.findOne( { where : { token: token } })

    // Hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash( password, salt)
    usuario.token = null
    await usuario.save()

    res.render('auth/confirm-account', {
        pagina:'Password restablecido',
        mensaje: 'El password se guardo correctamente'
    })

}

export {
    formularioLogin,
    formAuthenticate,
    formularioRegister,
    register,
    confirm,
    recoverPassword,
    resetPassword,
    verifyPassword,
    newPassword
}