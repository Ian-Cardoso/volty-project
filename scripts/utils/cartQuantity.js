import { cart } from '../../data/cart.js'

export function getCartQuantity() {
  let cartQuantity = 0
  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity
  })
  return `${cartQuantity} ${cartQuantity > 1 ? 'items' : 'item'} `
}

export function updateCheckoutItems() {
  const link = document.querySelector('.return-to-home-link')
  if (link) {
    link.innerHTML = getCartQuantity()
  }
}
