import React, { useState, useEffect} from 'react'
import '../App.css'
import logo from '../assets/logo.png'
import { Link } from 'react-router-dom'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { provider } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';


function Signup() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const LinkStyle = {
        textDecoration: 'none',
        color: 'black'
    }


    async function signinwithgoogle() {
        try {
            const res = await signInWithPopup(auth, provider)
            if (res) {
                console.log(res.user)
                navigate('/profile')
                
            toast.success(`${res.user.displayName} Signup Succesfully 😍`, {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light"
              });
            }
        }
        catch (err) {
            console.log(err)
        }
    }

  async function signup() {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password)
        if (res) {
            console.log(res.user)
            navigate('/profile')
           
        }

    }
    catch (err) {
        console.log(err.message)
  
  }
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
         <h2>Hello,There</h2>
         <p>We are happy to welcome you.</p>
         </div> 
         <div className='formPage py-3'>
           <input type="text" className="my-3" placeholder="Email" value={email} onChange={(e)=> setEmail(e.target.value)} aria-describedby="addon-wrapping" />
           <input type="password" className="my-3" placeholder="Password" value={password}  onChange={(e)=> setPassword(e.target.value) } aria-describedby="addon-wrapping" />
           <button onClick={signup} className='btn btn-primary w-100'>Signup</button>
           <button onClick={signinwithgoogle} type="button" className="btn w-100 text-dark my-3" style={{background: '#dddfe0'}}><img src="https://cdn-icons-png.flaticon.com/512/281/281764.png" alt="" /> Signin with Google</button>
         </div>
         <div className='bottomText'>Already have an account <Link to='/' style={LinkStyle}>Login</Link></div>
      </div>
      

      </div>
  )
}

export default Signup
