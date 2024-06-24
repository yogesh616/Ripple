import { useState, useEffect } from 'react'
import Login from './Routes/Login'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useNavigate } from 'react-router'
function App() {
  const navigate = useNavigate()
  useEffect(()=> {
    const authorize = onAuthStateChanged(auth, (user)=> {
      if (user) {
        console.log(user)
        navigate('/profile')

      }
    })
  }, [])

  return (
    <>
    <Login />
    </>
  )
}

export default App
