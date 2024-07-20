import React, { useState, useEffect} from 'react'
import '../App.css'
import logo from '../assets/logo.png'
import { Link } from 'react-router-dom'
import { auth, provider } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()




  async function signinwithgoogle() {
    try {
        const res = await signInWithPopup(auth, provider)
        if (res) {
            console.log(res.user)
            navigate('/profile')
        }
    }
    catch (err) {
        console.log(err)
    }
}

async function login() {
    try {
        const res = await signInWithEmailAndPassword(auth, email, password)
        if (res) {
           
            navigate('/profile')

            toast.success('Login Succesfully 😍', {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light"
              });

              localStorage.setItem('email', email)
              localStorage.setItem('password',  password)


        }
    } catch (error) {
        console.log(error.message)
        toast.error(`${error.message}`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light"
          
          })
    }
}

    const LinkStyle = {
        textDecoration: 'none',
        color: 'black'
    }
  return (
    <div className='main container text-center'>
    <div className='blueDiv'> 
      <img src={logo} alt="" />
        <h4>Be Verified</h4>
        <p>Rippling Through the Noise.</p>
      </div>
      <div className='page container'>
        <div className='topText'>
         <h2>Hello,Again</h2>
         <p>We are happy to have you back.</p>
         </div> 
         <div className='formPage py-3'>
           <input type="text" className="my-3" placeholder="Try test@gmail.com for testing" value={email} onChange={(e)=> setEmail(e.target.value)} aria-describedby="addon-wrapping" />
           <input type="password" className="my-3" placeholder="testuser" value={password} onChange={(e)=> setPassword(e.target.value)} aria-describedby="addon-wrapping" />
          <button className='btn btn-primary w-100' onClick={login}>Login</button>
           <button type="button" onClick={signinwithgoogle}  className="btn w-100 text-dark my-3" style={{background: '#dddfe0'}}><img src="https://cdn-icons-png.flaticon.com/512/281/281764.png" alt="" /> Signin with Google</button>
         </div>
         <div className='bottomText '>Don't have an account <Link to='/signup' style={LinkStyle}>Signup</Link></div>
      </div>
      
      <ToastContainer 
      autoClose={3000}
      />
      </div>
  )
}

export default Login
