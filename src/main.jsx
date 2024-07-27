import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Signup from './Routes/Signup.jsx'
import Profile from './Routes/Profile.jsx'
import 'react-toastify/dist/ReactToastify.css'
import Chat from './Routes/Chat.jsx'
import Upload from './Routes/Upload.jsx'
import Bio from './Routes/Bio.jsx'
import UserBio from './Routes/UserBio.jsx'
import Call from './Routes/Call.jsx'




ReactDOM.createRoot(document.getElementById('root')).render(


    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path='/upload' element={<Upload />} />
            <Route path='/bio' element={<Bio />} />
            <Route path='/user/:userDisplayName' element={<UserBio />} />
            <Route path='/call/:username/:callId' element={<Call />} />
           
        </Routes>
    </BrowserRouter>
  
  
  
)
