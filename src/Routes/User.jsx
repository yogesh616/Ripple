import React, {useState, useEffect} from 'react'
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, doc, arrayUnion, increment, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../App.css'
import logo from '../assets/logo.png'

function User() {
    const [userPost, setUserPost] = useState([])
    const [user, setUser] = useState(null)


useEffect(()=> {
    const res = onAuthStateChanged(auth, (state)=> {
        if (state) {
            setUser(state)
        }
    })
}, [])


    useEffect(() => {
        if (!user) return;
        const postCollection = collection(db, 'posts');
        const q = query(postCollection, where('uid', '==', user.uid)  ,orderBy('timestamp'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setUserPost(postsData)
            console.log(postsData);
        });

        return () => unsubscribe();
    }, []);
  return (
    <>
       <nav className='text-center'><img src={logo} alt="Logo" /></nav>
       <footer className=''>
                        <i className="fa-solid fa-house"></i>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <button
                            className="button"
                            type="button"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#offcanvasTop"
                            aria-controls="offcanvasTop"
                        >
                            <i className="fa-solid fa-plus"></i>
                        </button>
                        <i className="fa-regular fa-heart"></i>
                        <i style={{ cursor: 'pointer' }} data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight" className="fa-solid fa-user"></i>
                    </footer>
    </>
  )
}

export default User
