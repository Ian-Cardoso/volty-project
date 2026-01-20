export async function validateCoupon(code, orderTotal) {
  try {
    const response = await fetch('http://localhost:3000/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code: code.toUpperCase(), 
        orderTotal: parseFloat(orderTotal) 
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error }
    }

    const coupon = await response.json()
    return { success: true, coupon }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Failed to validate coupon' }
  }
}

export async function getActiveCoupons() {
  try {
    const response = await fetch('http://localhost:3000/coupons')
    
    if (!response.ok) return []
    
    const coupons = await response.json()
    return coupons
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}

export function formatDiscount(coupon) {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% OFF`
  } else {
    return `R$ ${coupon.discount_value.toFixed(2)} OFF`
  }
}

export function renderCoupons(coupons) {
  if (!coupons.length) {
    return '<p>No active coupons available</p>'
  }

  let html = '<div class="coupons-container">'
  
  coupons.forEach(coupon => {
    const minText = coupon.min_order_amount > 0 
      ? `Min: R$ ${coupon.min_order_amount.toFixed(2)}`
      : 'No minimum'
    
    html += `
      <div class="coupon-card">
        <div class="coupon-code">${coupon.code}</div>
        <div class="coupon-discount">${formatDiscount(coupon)}</div>
        <p class="coupon-description">${coupon.description || ''}</p>
        <p class="coupon-min">${minText}</p>
        <button class="coupon-apply-btn" onclick="applyCoupon('${coupon.code}')">
          Apply Coupon
        </button>
      </div>
    `
  })

  html += '</div>'
  return html
}

// Calcular desconto
export function calculateDiscount(coupon, total) {
  if (coupon.discount_type === 'percentage') {
    return (total * coupon.discount_value) / 100
  } else {
    return Math.min(coupon.discount_value, total)
  }
}
