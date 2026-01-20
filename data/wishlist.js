// ========================================
// wishlist.js - Gerenciar lista de desejos
// ========================================

export async function addToWishlist(productId) {
  const userId = localStorage.getItem('userId')
  
  if (!userId) {
    alert('Please login to add to wishlist')
    return false
  }

  try {
    const response = await fetch('http://localhost:3000/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId })
    })

    if (!response.ok) throw new Error('Failed to add to wishlist')
    
    console.log('Added to wishlist!')
    return true
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

export async function removeFromWishlist(productId) {
  const userId = localStorage.getItem('userId')
  
  if (!userId) return false

  try {
    const response = await fetch(
      `http://localhost:3000/wishlist/${userId}/${productId}`,
      { method: 'DELETE' }
    )

    if (!response.ok) throw new Error('Failed to remove')
    
    console.log('Removed from wishlist!')
    return true
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

export async function getWishlist() {
  const userId = localStorage.getItem('userId')
  
  if (!userId) return []

  try {
    const response = await fetch(`http://localhost:3000/wishlist/${userId}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}

export async function isInWishlist(productId) {
  const wishlist = await getWishlist()
  return wishlist.some(item => item.product_id === productId)
}
