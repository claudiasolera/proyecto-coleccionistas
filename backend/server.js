import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import productsRouter from './src/routes/products.js'
import categoriesRouter from './src/routes/categories.js'
import usersRouter from './src/routes/users.js'
import favoritosRouter from './src/routes/favoritos.js'
import pedidosRouter from './src/routes/pedidos.js'

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/users', usersRouter)
app.use('/api/favoritos', favoritosRouter)
app.use('/api/pedidos', pedidosRouter)

app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en puerto ${process.env.PORT}`)
})