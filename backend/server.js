import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import productsRouter from './src/routes/products.js'
import categoriesRouter from './src/routes/categories.js'
import usersRouter from './src/routes/users.js'
import favoritosRouter from './src/routes/favoritos.js'
import pedidosRouter from './src/routes/pedidos.js'
import pagosRouter from './src/routes/pagos.js'
import adminRouter from './src/routes/admin.js'
import messagesRouter from './src/routes/messages.js'

dotenv.config()
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors())
app.use(express.json())

// Servir archivos estáticos del frontend desde la raíz del proyecto
app.use(express.static(path.join(__dirname, '../frontend')))

app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/users', usersRouter)
app.use('/api/favoritos', favoritosRouter)
app.use('/api/pedidos', pedidosRouter)
app.use('/api/pagos', pagosRouter)
app.use('/api/admin', adminRouter)
app.use('/api/messages', messagesRouter)

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVIDOR ESCUCHANDO EN PUERTO: ${PORT}`);
});