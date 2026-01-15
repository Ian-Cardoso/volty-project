import { cart, clearCart } from '../../data/cart.js'
import { getProduct } from '../../data/products.js'
import { getDeliveryOption } from '../../data/deliveryOption.js'
import { formatCurrency } from '../utils/money.js'

// Função para enviar pedido ao servidor
async function sendOrderToServer(orderData) {
  try {
    const userId = localStorage.getItem('userId') || 'guest'
    
    const response = await fetch('http://localhost:3000/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cart: orderData })
    })
    
    if (!response.ok) {
      throw new Error('Erro ao enviar pedido')
    }
    
    console.log('Pedido enviado com sucesso!')
  } catch (error) {
    console.error('Erro ao enviar pedido:', error)
  }
}

export function renderPaymentSummary(){
    let productPriceCents = 0
    let shippingPriceCents = 0

    cart.forEach((cartItem) => {
       const product = getProduct(cartItem.productId)
       productPriceCents += product.priceCents * cartItem.quantity

      const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId)
      shippingPriceCents += deliveryOption.priceCents
    });

    const totalBeforeTaxCents = productPriceCents + shippingPriceCents
    const taxCents = totalBeforeTaxCents * 0.10
    const totalCents = taxCents + totalBeforeTaxCents

    console.log(`${formatCurrency(totalCents)}`);

    const paymentSummaryHTML = `
    <div class="payment-summary-title">
            Order Summary
          </div>

          <div class="payment-summary-row">
            <div>Items (3):</div>
            <div class="payment-summary-money">$${formatCurrency(productPriceCents)}</div>
          </div>

          <div class="payment-summary-row">
            <div>Shipping &amp; handling:</div>
            <div class="payment-summary-money">$${formatCurrency(shippingPriceCents)}</div>
          </div>

          <div class="payment-summary-row subtotal-row">
            <div>Total before tax:</div>
            <div class="payment-summary-money">$${formatCurrency(totalBeforeTaxCents)}</div>
          </div>

          <div class="payment-summary-row">
            <div>Estimated tax (10%):</div>
            <div class="payment-summary-money">$${formatCurrency(taxCents)}</div>
          </div>

          <div class="payment-summary-row total-row">
            <div>Order total:</div>
            <div class="payment-summary-money">$${formatCurrency(totalCents)}</div>
          </div>

          <button class="place-order-button button-primary">
            Place your order
          </button>
    `

    document.querySelector('.js-payment-summary')
        .innerHTML = paymentSummaryHTML

    const placeOrderButton = document.querySelector('.place-order-button')
    if (placeOrderButton) {
      const cartIsEmpty = cart.length === 0
      placeOrderButton.disabled = cartIsEmpty


      placeOrderButton.addEventListener('click', async () => {
        if (cartIsEmpty) return
        
        await saveOrder()
        window.location.href = 'orders.html'
      })
    }

    async function saveOrder() {
      if (cart.length === 0) return
      
      const previousOrders = JSON.parse(localStorage.getItem('orders')) || []

      let productPriceCents = 0
    let shippingPriceCents = 0

    cart.forEach((cartItem) => {
        const product = getProduct(cartItem.productId)
       productPriceCents += product.priceCents * cartItem.quantity

      const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId)
      shippingPriceCents += deliveryOption.priceCents
    });

    const totalBeforeTaxCents = productPriceCents + shippingPriceCents
    const taxCents = totalBeforeTaxCents * 0.10
    const totalCents = taxCents + totalBeforeTaxCents

    const cartCopy = JSON.parse(JSON.stringify(cart))
    cartCopy.forEach((cartItem) => {
      const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId)
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + deliveryOption.deliveryDays)
      cartItem.deliveryDate = deliveryDate.toISOString()
    })

      // previousOrders.push({
      //   date: new Date().toISOString(),
      //   cart: JSON.parse(JSON.stringify(cart)),
      //   totalCents
      // })

      previousOrders.push({
        date: new Date().toISOString(),
        cart: cartCopy,
        totalCents
      })

      console.log(previousOrders);
      
      localStorage.setItem('orders', JSON.stringify(previousOrders))
      
      // Enviar pedido ao servidor
      await sendOrderToServer(cartCopy)
      
      // Limpar o carrinho
      clearCart()
    }
}