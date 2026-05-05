export async function addToWishlist(productId) {
  const userId = parseInt(localStorage.getItem('userId'));
  const token = localStorage.getItem('accessToken');

  if (!userId || !token) {
    alert('Por favor, faça login para adicionar aos favoritos.');
    return false;
  }

  try {
    const response = await fetch('http://localhost:3000/wishlist', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ userId, productId })
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Sessão expirada. Por favor, faça login novamente.');
      }
      throw new Error('Failed to add to wishlist');
    }
    
    console.log('Adicionado com sucesso!');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function removeFromWishlist(productId) {
  const userId = localStorage.getItem('userId')
  const token = localStorage.getItem('accessToken')
  
  if (!userId) return false

  try {
    const response = await fetch(
      `http://localhost:3000/wishlist/${userId}/${productId}`,
      { 
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
       }
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
  const token = localStorage.getItem('accessToken')
  
  if (!userId || !token) return []

  try {
    const response = await fetch(`http://localhost:3000/wishlist/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      console.error('Failed to fetch wishlist')
      return []
  }

    const data = await response.json()

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return []
  }
}

export async function isInWishlist(productId) {
  const wishlist = await getWishlist();
  
  if (!Array.isArray(wishlist)) return false;

  return wishlist.some(item => {
    const idNoBanco = String(item.product_id).trim();
    const idBuscado = String(productId).trim();
    
    return idNoBanco === idBuscado;
  });
}