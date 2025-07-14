import express from 'express'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import db from './config/db.js'

//crear app
const app = express()

//habilitar lectura de datos de formularios
//app.use es un middleware
app.use( express.urlencoded({extended:true}))


//habilitar cookie parser
app.use( cookieParser() )

//habilitar CSRF
app.use (csurf({cookie:true}))

//conexion a la base de datos
try {
    await db.authenticate();
    db.sync()
    console.log('conexion correcta a la base de datos')
} catch (error) {
    console.log(error)
}

//Habilitar pug
app.set('view engine', 'pug')
app.set('views', './views')

//carpeta publica
app.use(express.static('public'))

//Routing
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)

// definicion del puerto y arrancar el proyecto
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`servidor escuchando en el puerto ${port}`)
});