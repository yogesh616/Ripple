import React, { useEffect, useState, useCallback } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { Navigate, useNavigate } from 'react-router';
import logo from '../assets/logo.png';
import avatar from '../assets/user.png';
import './profile.css';
import '../index.css'
import './pageLoader.css'
import './comment.css'
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, doc, arrayUnion, increment, where, setDoc, getDoc, getDocs } from 'firebase/firestore';
import {
    Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Input
} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import EmojiPicker from 'emoji-picker-react';
import { ToastContainer, toast, Flip } from 'react-toastify';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

import { Link } from 'react-router-dom';
import social from '../assets/social.png';
import { bottom } from '@popperjs/core';










function Profile() {
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [text, setText] = useState('');
    const [posts, setPosts] = useState([]);
    const [UID, setUID] = useState();
    const [comment, setComment] = useState('');
    const [activePost, setActivePost] = useState(null); 
    const [userPost, setUserPost] = useState([]);
    const [userList, setUserList] = useState([]);
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [downloadURL, setDownloadURL] = useState('');
    const [loading, setLoading] = useState(false);
    const [postTime, setPostTime] = useState();
    const [fullSize, setFullSize] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioPlayer, setAudioPlayer] = useState(null);
   
    
    const seeFullSize = (src)=> {
        setFullSize(src)
    };
    
    const closeFullSize = ()=> {
       setFullSize(null);
    };
   

    // Chakra UI
    const { isOpen, onOpen, onClose } = useDisclosure();

    const imgStyle = {
        minWidth: '80px',
        minHeight: '40px',
        borderRadius: '50%',
    };
    const cmtStyle = {
        minWidth: '30px',
        minHeight: '30px',
        borderRadius: '50%',
    };
    const bgColor = {
        background: '#403d3d',
        color: '#fff'
    };
    const postPhotoStyle = {
        borderRadius: '15px',
        maxWidth: '10rem',
        padding: '0.25rem',
        objectFit: 'cover',
        cursor: 'pointer'
        };
        
        
    

        const handleAuthStateChange = useCallback(async (authUser) => {
            if (authUser) {
                setUser(authUser);
                
                const userDisplayName = encodeURIComponent(authUser.displayName);
                setUID(authUser.uid);
    
                toast.success(`Welcome ${authUser.displayName || authUser.email}`, {
                    position: "top-right",
                    autoClose: 1000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    transition: Flip,
                });
    
                try {
                    const userRef = doc(db, 'users', authUser.uid);
                    const userSnap = await getDoc(userRef);
                    const usersSnapshot = await getDocs(collection(db, 'users'));
    
                    if (!usersSnapshot.empty) {
                        const userList = usersSnapshot.docs.map(doc => doc.data());
                       
                        setUserList(userList);
                    }
    
                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            uid: authUser.uid,
                            displayName: authUser.displayName,
                            email: authUser.email,
                            photoURL: authUser.photoURL,
                        });
                       
                    }
                } catch (error) {
                    console.log('Error adding user', error);
                }
            } else {
                navigate('/');
            }
        }, [navigate, db]); // Adding navigate and db as dependencies
    
        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
            return () => unsubscribe();
        }, [handleAuthStateChange]);





    const logout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.log(error);
        }
    };

    const createPost = async () => {
        try {
           const postImageUrl = await handleUpload();
            const timestamp = serverTimestamp();
            const postRef = await addDoc(collection(db, 'posts'), {
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
                timestamp: timestamp,
                text: text,
                likesCount: 0,
                commentsCount: 0,
                likedBy: [], // initialize likedBy array
                comments: [],
                postImg: postImageUrl // initialize comments array
            });
            if (postRef) {
                
                setText('');
                toast.success('Post created', {
                    position: "top-right",
                    autoClose: 1000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    transition: Flip,
                    });
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        const postCollection = collection(db, 'posts');
        const q = query(postCollection, orderBy('timestamp'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setPosts(postsData.reverse());
            console.log(postsData)

            
           
            
           
            
        });

        return () => unsubscribe();
    }, []);


    // notification function
    const handleLike = async (postId, likedBy = []) => {
        if (likedBy.some(like => like.uid === user.uid)) {
        
           
            return;
        }

        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                likesCount: increment(1),
                likedBy: arrayUnion({ uid: user.uid, name: user.displayName, photo: user.photoURL }) // add user ID to likedBy array
            });
        } catch (error) {
            console.log('Error updating likes count:', error);
        }
    };
    

    const handleComment = async (postId) => {
        if (!comment) {
          
            return;
        }

        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                commentsCount: increment(1),
                comments: arrayUnion({ uid: user.uid, name: user.displayName, photo: user.photoURL, comment: comment })
            });
            setComment(''); // Clear the comment input field after submission
           
        } catch (error) {
            console.log('Error updating comments count:', error);
        }
    };

    


    // User's Posts
    useEffect(() => {
        if (!user) return;
        const postCollection = collection(db, 'posts');
        const q = query(postCollection, where('uid', '==', user.uid), orderBy('timestamp'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userPostsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setUserPost(userPostsData);
          
           
        });

        return () => unsubscribe();
    }, [user]);


    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
       setFile(selectedFile);
    };
    
    const handleUpload = async () => {
        if (file) {
            const storageRef = ref(storage, `uploads/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            setLoading(true);
    
            toast.info(`Uploading...`, {
                autoClose: 1000,
                hideProgressBar: true,
                transition: Flip
            });
    
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        setProgress(progress);
                        
    
                        // Update the toast with the progress percentage
                     if (progress === 100) {
                        toast.info(`Uploading...${progress}%`, {
                            autoClose: 1000,
                            hideProgressBar: true,
                            transition: Flip
                        });
                     }
                    },
                    (error) => {
                        console.error('Upload failed:', error);
                        setLoading(false);
                       
                        reject(error);
                    },
                    async () => {
                        try {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            setDownloadURL(url);
                            setLoading(false);
    
                            // Update the toast when the upload is completed
                           
                            resolve(url);
                        } catch (error) {
                            console.error('Error getting download URL:', error);
                            setLoading(false);
                           
                            reject(error);
                        }
                    }
                );
            });
        } else {
            console.error('No file selected');
            return null;
        }
    };
    
    const isMediaUrl = (url, type) => {
        const regex = new RegExp(`\\.${type}(?:\\?|$)`);
        return regex.test(url);
    };

   function setTime(sec, nanoSec) {
    const timestamp = {
        seconds: sec,
        nanoseconds: nanoSec
    }
    const milliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);

// Create a Date object
const date = new Date(milliseconds);

// Format the date as needed
const formattedDate = date.toLocaleString();  // e.g., "7/17/2024, 2:43:02 PM"


setPostTime(formattedDate)
      
return formattedDate;

   }
 


   const handlePlayPause = (audioURL) => {
    if (audioPlayer && audioPlayer.src === audioURL) {
      if (isPlaying) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (audioPlayer) audioPlayer.pause();
      const newAudioPlayer = new Audio(audioURL);
      newAudioPlayer.play();
      setAudioPlayer(newAudioPlayer);
      setIsPlaying(true);
    }
  };
  function convertTimestamp(timestamp) {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 100000)
    return date.toLocaleString();
}


   

    return (
        <>
            {user ? (
    <div className="profile bg-dark" style={{height:'100%', marginBottom: '50px'}}>
        <nav className="d-flex align-items-center justify-content-between px-4">
            <h2 className='fs-3' style={{color: '#e1e1e1'}}>Ripple</h2>
            <img src={logo} alt="Logo" style={{marginTop: '24px'}} />
           <div className='dropdown'>
            <span><img src={user.photoURL} alt="" style={{animation: 'none', width: '50px', height: '50px', borderRadius: '50%', marginTop: '24px'}} /></span>
            
           </div>
           
     
     
          


{loading && (<div id='loader'></div>)}
         


        </nav>

        {/* Offcanvas for User Profile */}
        <div className="offcanvas offcanvas-end bgColor text-white" tabIndex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
            <div className="offcanvas-header mb-3">
            <div className='d-flex align-items-center justify-content-between flex-wrap w-100 mt-5'>
  <h5 className="offcanvas-title mb-2 mb-md-0" id="offcanvasRightLabel">
    &nbsp; {user.displayName}    
  </h5>
 {/* <img src={user.photoURL} alt="" className="img-fluid" style={{ maxWidth: '50px', borderRadius: '50%' }} /> */}
</div>
<button className="logout" onClick={logout}>
 Logout
</button>

               
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body">
            {/* User's Bio */ }
           



                {/* User's Posts */}
               
{userPost.length > 0 ? (
     <div className="container postContainer">
                {posts.map((post) => (
                    <>
                     <div key={post.id} className="postField text-gray-400 border-1 border-t border-x flex justify-start gap-1 mb-3 md:mb-4 rounded-tr-xl rounded-tl-xl px-3 md:px-4 py-[.85rem] relative">
                     <div className="pt-[5px] mr-2 flex flex-col justify-between items-center">
                       <a
                         title={`View Profile of ${post.displayName}`}
                         
                       >
                         <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                           <img
                             className="aspect-square h-full w-full"
                             referrerPolicy="no-referrer"
                             alt={`Profile Image of ${post.displayName}`}
                             src={post.photoURL || avatar}
                            
                           />
                         </span>
                       </a>
                     </div>
                     <div className="w-full">
                       <div className="flex items-center justify-between">
                         <a
                           className="flex flex-wrap items-center text-xs mr-2 py-1 __className_e27b8e"
                          
                         >
                           <p className="font-bold mr-1">{post.displayName}</p>
                         </a>
                       </div>
                       <a>
                         
                         <div className="pt-[.19rem] md:pt-1 flex text-xs flex-wrap justify-start items-center text-[#6b6e6e] __className_e27b8e">
                          {post?.timestamp &&  (<p className="mr-1">{convertTimestamp(post.timestamp)}</p>)}
                         </div>
                       </a>
                       <div className="text-sm md:text-base mt-[0.28rem] py-1 whitespace-pre-line __className_aaf875">
                         {post.text}
                       </div>
                       {post?.postImg  && (
                           <img  style={{postPhotoStyle}}
                           onClick={() => seeFullSize(post.postImg)} className="cursor-pointer object-cover w-full h-32 md:h-48 rounded-md"src={post.postImg} alt="Post Image"/>
                        )}

                       
                       <div className="flex gap-[.63rem] md:gap-3 mt-2 pt-1 items-center">
                           
                       <label className="container-like  d-flex gap-2">
  <input type="checkbox" />
  <svg onClick={()=> handleLike(post.id, post.likedBy)} 
  className={`icon ${post.likedBy.some(like => like.uid === user.uid) ? 'active-like' : 'inactive-like'}`}
  id="Glyph" version="1.1" viewBox="0 0 32 32" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"><path d="M29.845,17.099l-2.489,8.725C26.989,27.105,25.804,28,24.473,28H11c-0.553,0-1-0.448-1-1V13  c0-0.215,0.069-0.425,0.198-0.597l5.392-7.24C16.188,4.414,17.05,4,17.974,4C19.643,4,21,5.357,21,7.026V12h5.002  c1.265,0,2.427,0.579,3.188,1.589C29.954,14.601,30.192,15.88,29.845,17.099z" id="XMLID_254_"></path><path d="M7,12H3c-0.553,0-1,0.448-1,1v14c0,0.552,0.447,1,1,1h4c0.553,0,1-0.448,1-1V13C8,12.448,7.553,12,7,12z   M5,25.5c-0.828,0-1.5-0.672-1.5-1.5c0-0.828,0.672-1.5,1.5-1.5c0.828,0,1.5,0.672,1.5,1.5C6.5,24.828,5.828,25.5,5,25.5z" id="XMLID_256_"></path></svg>
  <span>{post.likesCount}</span>
</label>

                           
                         
<label className='container-like d-flex gap-2'>
<button  type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom" aria-controls="offcanvasBottom">
<svg className='icon inactive-like' viewBox="0 0 512 512" height="1em"><path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4c26.5 9.6 56.2 15.1 87.8 15.1c124.7 0 208-80.5 208-160s-83.3-160-208-160S48 160.5 48 240c0 32 12.4 62.8 35.7 89.2c8.6 9.7 12.8 22.5 11.8 35.5c-1.4 18.1-5.7 34.7-11.3 49.4c17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208s-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6c-15.1 6.6-32.3 12.6-50.1 16.1c-.8 .2-1.6 .3-2.4 .5c-4.4 .8-8.7 1.5-13.2 1.9c-.2 0-.5 .1-.7 .1c-5.1 .5-10.2 .8-15.3 .8c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c4.1-4.2 7.8-8.7 11.3-13.5c1.7-2.3 3.3-4.6 4.8-6.9c.1-.2 .2-.3 .3-.5z"></path></svg>
   
</button>
    <span>{post.commentsCount}</span>
</label>
                       </div>
                     </div>
                   </div>
                   </>
                ))}
            </div>
) : (
    <span>No Posts</span>
)}


                
                

               
            </div>
        </div>

        {/* Footer Navigation */}
        <footer className="d-flex justify-content-around pd-3">
           <Link to='/'> <i className="fa-solid fa-house" style={{cursor: 'pointer'}}> </i></Link>
            <i className="fa-solid fa-magnifying-glass" style={{display: 'none'}}></i>
            <button className="btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasTop" aria-controls="offcanvasTop">
                <i style={{color: '#fff'}} className="fa-solid fa-plus"></i>
            </button>
          { /* <i className="fa-regular fa-heart" style={{display: 'none'}}></i> */ }
          <Link to='/chat'>  <i className="fa-brands fa-facebook-messenger" style={{cursor: 'pointer'}}></i>
          </Link>
        
            <i className="fa-solid fa-user" style={{ cursor: "pointer" }} data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight"></i>
        </footer>





        

        {/* Offcanvas for Creating Post */}
        <div className="offcanvas offcanvas-top" style={{ background: "#403d3d", color: "#fff" }} tabIndex="-1" id="offcanvasTop" aria-labelledby="offcanvasTopLabel">
            <div className="offcanvas-header text-center">
                <h5 className="offcanvas-title" id="offcanvasTopLabel">New Ripple</h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body container-fluid">
                <div className="post">
                    <div><img src={user.photoURL} alt={user.displayName} style={{height:'50px', width: '50px'}} className="rounded-circle" loading='lazy' /></div>
                    <h5>{user.displayName}</h5>
                    <div className="body d-flex align-items-center ">
                        
                       <div> <input
                       
                            type="text"
                            value={text}
                            placeholder="Start a ripple..."
                            onChange={(e) => setText(e.target.value)}
                            className="form-control my-2 postText"
                        /></div>
                     <label className="custum-file-upload" htmlFor="file">
   <input style={{opacity: '0'}} type="file" id="file" onChange={handleFileChange} />
   <i style={{marginBottom: '30px', fontSize: '38px'}} className="fa-regular fa-image"></i>
</label>
                    </div>
                   
                    {text && (
                      

<button id='ldr' data-bs-dismiss='offcanvas' aria-label='Close'  onClick={createPost}>
 Post
</button>



                    )}
                </div>
            </div>
        </div>

        <ChakraProvider>
            {/* Post Field */}
            {posts ? (
                <div className="container postContainer">
                {posts.map((post, index) => (
                    <>
                     <div key={index} className="postField text-gray-400 border-1 border-t border-x flex justify-start gap-1 mb-3 md:mb-4 rounded-tr-xl rounded-tl-xl px-3 md:px-4 py-[.85rem] relative">
                     <div className="pt-[5px] mr-2 flex flex-col justify-between items-center">
                       <a
                         title={`View Profile of ${post.displayName}`}
                         
                       >
                         <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                           <img
                             className="aspect-square h-full w-full"
                             referrerPolicy="no-referrer"
                             alt={`Profile Image of ${post.displayName}`}
                             src={post.photoURL || avatar}
                            
                           />
                         </span>
                       </a>
                     </div>
                     <div className="w-full">
                       <div className="flex items-center justify-between">
                         <a
                           className="flex flex-wrap items-center text-xs mr-2 py-1 __className_e27b8e"
                          
                         >
                           <p className="font-bold mr-1">{post.displayName}</p>
                         </a>
                       </div>
                       <a>
                         
                         <div className="pt-[.19rem] md:pt-1 flex text-xs flex-wrap justify-start items-center text-[#6b6e6e] __className_e27b8e">
                          {post?.timestamp &&  (<p className="mr-1">{convertTimestamp(post.timestamp)}</p>)}
                         </div>
                       </a>
                       <div className="text-sm md:text-base mt-[0.28rem] py-1 whitespace-pre-line __className_aaf875">
                         {post.text}
                       </div>
                       {post?.postImg  && (
                           <img  style={{postPhotoStyle}}
                           onClick={() => seeFullSize(post.postImg)} className="cursor-pointer object-cover w-full h-32 md:h-48 rounded-md"src={post.postImg} alt="Post Image"/>
                        )}

                       
                       <div className="flex gap-[.63rem] md:gap-3 mt-2 pt-1 items-center">
                           
                          
                     {/* like */}
<label className="container-like  d-flex gap-2">
  <input type="checkbox" />
  <svg onClick={()=> handleLike(post.id, post.likedBy)} 
  className={`icon ${post.likedBy.some(like => like.uid === user.uid) ? 'active-like' : 'inactive-like'}`}
  id="Glyph" version="1.1" viewBox="0 0 32 32" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"><path d="M29.845,17.099l-2.489,8.725C26.989,27.105,25.804,28,24.473,28H11c-0.553,0-1-0.448-1-1V13  c0-0.215,0.069-0.425,0.198-0.597l5.392-7.24C16.188,4.414,17.05,4,17.974,4C19.643,4,21,5.357,21,7.026V12h5.002  c1.265,0,2.427,0.579,3.188,1.589C29.954,14.601,30.192,15.88,29.845,17.099z" id="XMLID_254_"></path><path d="M7,12H3c-0.553,0-1,0.448-1,1v14c0,0.552,0.447,1,1,1h4c0.553,0,1-0.448,1-1V13C8,12.448,7.553,12,7,12z   M5,25.5c-0.828,0-1.5-0.672-1.5-1.5c0-0.828,0.672-1.5,1.5-1.5c0.828,0,1.5,0.672,1.5,1.5C6.5,24.828,5.828,25.5,5,25.5z" id="XMLID_256_"></path></svg>
  <span>{post.likesCount}</span>
</label>

{/* comment */}
<label className='container-like d-flex gap-2'>
<button  type="button" data-bs-toggle="offcanvas" data-bs-target={`#offcanvasBottom${index}`} aria-controls="offcanvasBottom">
<svg className='icon inactive-like' viewBox="0 0 512 512" height="1em"><path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4c26.5 9.6 56.2 15.1 87.8 15.1c124.7 0 208-80.5 208-160s-83.3-160-208-160S48 160.5 48 240c0 32 12.4 62.8 35.7 89.2c8.6 9.7 12.8 22.5 11.8 35.5c-1.4 18.1-5.7 34.7-11.3 49.4c17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208s-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6c-15.1 6.6-32.3 12.6-50.1 16.1c-.8 .2-1.6 .3-2.4 .5c-4.4 .8-8.7 1.5-13.2 1.9c-.2 0-.5 .1-.7 .1c-5.1 .5-10.2 .8-15.3 .8c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c4.1-4.2 7.8-8.7 11.3-13.5c1.7-2.3 3.3-4.6 4.8-6.9c.1-.2 .2-.3 .3-.5z"></path></svg>
   
</button>
    <span>{post.commentsCount}</span>
</label>

            {/* offcanvas for comments */}
            <div className="offcanvas offcanvas-bottom w-100" style={{height: '70%', background: '#212529', color: '#e1e1e1'}} tabIndex="-1" id={`offcanvasBottom${index}`} aria-labelledby="offcanvasBottomLabel">
  <div className="offcanvas-header">
    <h5 className="offcanvas-title" id="offcanvasBottomLabel">Comments</h5>
    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div className="offcanvas-body small ">
    { /* Comments List */}
    <div className=' overflow-y-auto' style={{marginTop: '-32px', height: '85%'}}>
    {
    post?.comments?.length > 0 ? (
        post.comments.map((comment, index) => (
            <ol key={index} className='overflow-y-auto' >
               <li>
               <div className="comment">
		<div className="user-banner">
			<div className="user">
				<div className="avatar">
					<img src={comment.photo} />
					
				</div>
				<h5>{comment.name}</h5>
			</div>
			<button className="btncmt dropdown"><i className="ri-more-line"></i></button>
		</div>
		<div className="content">
			<p>{comment.comment}</p>
		</div>
		
	</div>
               </li>
            </ol>
        ))
    ) : (
        <span>No comments</span>
    )
}
</div>
 
  <div className="" style={{position: 'absolute', bottom: '10px', width: '92%', zIndex: '3', background: '#212529'}}>
   <div className="input-group mb-3 text-center" >
  <input value={comment} onChange={(e) => setComment(e.target.value)} type="text" className="form-control" style={{ color: '#e1e1e1', background: 'transparent', opacity: '1'}} placeholder="Add a comment..." aria-label="Username" aria-describedby="basic-addon1"  />
  <span onClick={() => handleComment(post.id)} style={{borderRadius: '0 25px 25px 0', background: 'transparent', color: '#e1e1e1', cursor: 'pointer', border: 'solid 1px #393737'}} className="input-group-text" id="basic-addon1">@</span>
</div>
      
    </div>
    
   
    
  </div>
</div>

                           
                         
            
                        
                       </div>
                     </div>
                   </div>
                   </>
                ))}
            </div>
            ) : (
                <p className="text-center text-white">Nothing here</p>
            )}

            {/* Modal for comments */}
            <Modal onClose={onClose} isOpen={isOpen} isCentered>
                <ModalOverlay />
                <ModalContent style={{ background: "#403d3d", color: "#fff" }}>
                    <ModalHeader>Comments</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {posts.find(post => post.id === activePost)?.comments?.map((c, index) => (
                            <div key={index} className="d-flex">
                                <p>{c.name}: {c.comment}</p>
                            </div>
                        ))}
                        <div className="cmtSection mt-3">
                            <Input
                                placeholder="Add a comment..."
                                size="md"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <Button colorScheme="gray" onClick={() => handleComment(activePost)} className="mt-2">
                                Comment
                            </Button>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            { /* full size image*/}

            {fullSize && (
                <div className="fullSizeImage" onClick={closeFullSize}>
                    <img src={fullSize} alt="Full Size" />
                    <button onClick={closeFullSize}>
                    <i className="fa-solid fa-x"></i>
                    </button>
                </div>
            )}
        </ChakraProvider>

        <ToastContainer />
    </div>
) : (
    <div className='pageLoader'><img src={logo} alt="" /> </div>
)}

        </>
    );
}

export default Profile;
