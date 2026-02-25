// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true
  
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = tokenData.exp * 1000
    return Date.now() >= expirationTime
  } catch (error) {
    return true
  }
}

// Get token expiration time
export const getTokenExpiration = (token) => {
  if (!token) return null
  
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]))
    return new Date(tokenData.exp * 1000)
  } catch (error) {
    return null
  }
}