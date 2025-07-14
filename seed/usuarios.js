import bcrypt from 'bcrypt'

const usuarios = [
    {
        nombre:'cristian',
        email:'cris@cris.com',
        confirmado: 1,
        password: bcrypt.hashSync('password', 10)
    }
]

export default usuarios