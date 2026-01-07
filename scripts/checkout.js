import { renderOrderSummary } from './checkout/orderSummary.js'
import { renderPaymentSummary } from './checkout/paymentSummary.js'
import { updateCheckoutItems } from './utils/cartQuantity.js';
import { loadFromStorage } from '../data/cart.js'

//import '../data/cart-class.js'

loadFromStorage()
renderOrderSummary()
renderPaymentSummary()
updateCheckoutItems()