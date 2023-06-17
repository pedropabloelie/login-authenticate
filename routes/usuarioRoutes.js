import express  from "express"
import { 
    formularioLogin, 
    formAuthenticate,
    formularioRegister, 
    register, 
    recoverPassword, 
    confirm, 
    resetPassword,
    verifyPassword,
    newPassword
} from "../controllers/usuarioController.js"

const router = express.Router()

router.get('/login', formularioLogin)
router.post('/login', formAuthenticate)
router.get('/register', formularioRegister)
router.post('/register', register)
router.get('/confirm/:token', confirm )
router.get('/recover-password', recoverPassword)
router.post('/recover-password', resetPassword)

// Nuevo Password
router.get('/recover-password/:token', verifyPassword)
router.post('/recover-password/:token', newPassword)

export default router