import jwt from 'jsonwebtoken';

const generarJWT = id => jwt.sign({id}, process.env.JWT_SECRET,{expiresIn:'1d'})

const generalId =() => Math.random().toString(32).substring(2) + Date.now().toString(32);

export{
    generalId,
    generarJWT
}