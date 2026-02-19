import { cart, clearCart } from '../../data/cart.js'
import { getProduct } from '../../data/products.js'
import { getDeliveryOption } from '../../data/deliveryOption.js'
import { formatCurrency } from '../utils/money.js'
import { validateCoupon } from '../../data/coupons.js'

// Função para enviar pedido ao servidor
async function sendOrderToServer(orderData, couponCode = null, discountAmount = 0) {
  try {
    const userId = localStorage.getItem('userId') || 'guest'
    
    const response = await fetch('http://localhost:3000/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        cart: orderData,
        couponCode,
        discountAmount 
      })
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
    let discountAmount = 0

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

          <div class="coupon-section">
            <label>Coupon Code (Optional)</label>
            <div class="coupon-input-group">
              <input type="text" id="couponInput" placeholder="Enter coupon code" maxlength="50">
              <button id="applyCouponBtn" class="apply-coupon-btn">Apply</button>
            </div>
            <div id="couponMessage"></div>
            <div id="discountRow" class="payment-summary-row" style="display: none;">
              <div>Discount:</div>
              <div class="payment-summary-money" id="discountAmount">-$0.00</div>
            </div>
          </div>

          <div class="payment-summary-row total-row">
            <div>Order total:</div>
            <div class="payment-summary-money" id="finalTotal">$${formatCurrency(totalCents)}</div>
          </div>

          <button class="place-order-button button-primary">
            Place your order
          </button>
    `

    document.querySelector('.js-payment-summary')
        .innerHTML = paymentSummaryHTML

    // Variável para rastrear desconto
    let appliedCoupon = null
    let currentDiscount = 0

    const applyCouponBtn = document.getElementById('applyCouponBtn')
    const couponInput = document.getElementById('couponInput')
    const couponMessage = document.getElementById('couponMessage')
    const discountRow = document.getElementById('discountRow')
    const discountAmountEl = document.getElementById('discountAmount')
    const finalTotalEl = document.getElementById('finalTotal')

    applyCouponBtn.addEventListener('click', async () => {
      const code = couponInput.value.trim()
      
      if (!code) {
        couponMessage.textContent = 'Please enter a coupon code'
        couponMessage.style.color = '#d32f2f'
        return
      }

      const totalInReais = (totalBeforeTaxCents + taxCents) / 100

      const result = await validateCoupon(code, totalInReais)

      if (!result.success) {
        couponMessage.textContent = result.error
        couponMessage.style.color = '#d32f2f'
        discountRow.style.display = 'none'
        currentDiscount = 0
      } else {
        appliedCoupon = result.coupon
        currentDiscount = result.coupon.discountAmount
        couponMessage.textContent = `✓ Coupon applied! Saving $${currentDiscount.toFixed(2)}`
        couponMessage.style.color = '#4caf50'
        
        discountAmountEl.textContent = `-$${currentDiscount.toFixed(2)}`
        discountRow.style.display = 'flex'

        const finalTotal = totalCents / 100 - currentDiscount
        finalTotalEl.textContent = `$${finalTotal.toFixed(2)}`
      }

      // Salvar cupom aplicado no localStorage
      if (appliedCoupon) {
        localStorage.setItem('appliedCoupon', JSON.stringify({
          code: appliedCoupon.code,
          discountAmount: currentDiscount
        }))
      }
    })

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
    let totalCents = taxCents + totalBeforeTaxCents

    // Aplicar desconto do cupom se existir
    const appliedCouponData = localStorage.getItem('appliedCoupon')
    let discountCents = 0
    let couponCode = null
    
    if (appliedCouponData) {
      const coupon = JSON.parse(appliedCouponData)
      discountCents = Math.round(coupon.discountAmount * 100)
      couponCode = coupon.code
      totalCents -= discountCents
    }

    const cartCopy = JSON.parse(JSON.stringify(cart))
    cartCopy.forEach((cartItem) => {
      const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId)
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + deliveryOption.deliveryDays)
      cartItem.deliveryDate = deliveryDate.toISOString()
    })

      previousOrders.push({
        date: new Date().toISOString(),
        cart: cartCopy,
        totalCents,
        discountCents,
        couponCode,
        subtotal: totalBeforeTaxCents + taxCents
      })

      console.log(previousOrders);
      
      localStorage.setItem('orders', JSON.stringify(previousOrders))
      
      // Enviar pedido ao servidor com informações do cupom
      await sendOrderToServer(cartCopy, couponCode, discountCents)
      
      // Limpar o carrinho e o cupom
      clearCart()
      localStorage.removeItem('appliedCoupon')
    }
}