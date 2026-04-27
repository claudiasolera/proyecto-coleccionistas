import { Router } from 'express'
import { 
    getShippingMethods, 
    createShippingMethod, 
    updateShippingMethod, 
    deleteShippingMethod 
} from '../controllers/shipping.js'

const router = Router()

router.get('/', getShippingMethods)
router.post('/', createShippingMethod)
router.put('/:id', updateShippingMethod)
router.delete('/:id', deleteShippingMethod)

export default router
