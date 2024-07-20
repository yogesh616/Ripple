import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router';
import logo from '../assets/logo.png';
import avatar from '../assets/user.png';
import './profile.css';
import '../index.css'
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, doc, arrayUnion, increment, where, setDoc, getDoc, getDocs } from 'firebase/firestore';
import {
    Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Input
} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import EmojiPicker from 'emoji-picker-react';
import { ToastContainer, toast } from 'react-toastify';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import ReactAudioPlayer from 'react-audio-player';
import { Link } from 'react-router-dom';
import social from '../assets/social.png'




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
    const [postTime, setPostTime] = useState()
    
  
   

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
        };
        
        
    

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                
                setUID(user.uid);

                toast.success(`Welcome ${user.displayName}`, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light"
                    });
                    
                    try {
                        const userRef = doc(db, 'users', user.uid);
                        const userSnap = await getDoc(userRef);
                        const usersSnapshot = await getDocs(collection(db, 'users'));
                
                if (!usersSnapshot.empty) {
                    const userList = usersSnapshot.docs.map(doc => doc.data());
                    console.log(userList)

                    setUserList(userList);
                }

              
                        if (!userSnap.exists()) {
                          await setDoc(userRef, {
                            uid: user.uid,
                            displayName: user.displayName,
                            email: user.email,
                            photoURL: user.photoURL
                          });
                          console.log('User added successfully')
                          
                        }
                      } catch (error) {
                        console.log('Error adding user', error);
                      }
            }
            else {
                navigate('/')
            }
        });

        return () => unsubscribe();
    }, []);








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
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light"
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
            console.log('User has already liked this post.');
            console.log(likedBy);
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
            console.log('Comment is empty');
            return;
        }

        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                commentsCount: increment(1),
                comments: arrayUnion({ uid: user.uid, name: user.displayName, photo: user.photoURL, comment: comment })
            });
            setComment(''); // Clear the comment input field after submission
            toast.success('Commented', {
                position: "bottom-left",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light"
                });
        } catch (error) {
            console.log('Error updating comments count:', error);
        }
    };

    const openCommentModal = (postId) => {
        setActivePost(postId);
        onOpen();
    };



    // User's Posts
    useEffect(() => {
        if (!user) return;
        const postCollection = collection(db, 'posts');
        const q = query(postCollection, where('uid', '==', user.uid), orderBy('timestamp'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userPostsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setUserPost(userPostsData);
            console.log('user post data', userPostsData);
           
        });

        return () => unsubscribe();
    }, [user]);


    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
      };
    
      const handleUpload = async () => {
        if (file) {
            const storageRef = ref(storage, `uploads/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            setLoading(true);
    
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        setProgress(progress);
                        console.log('Upload is ' + progress + '% done');
                        if (progress === 100) {
                            console.log('Upload completed!');
                            toast.success('file uploaded', {
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
            throw new Error('No file selected');
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
        console.log(postTime);
return formattedDate;

   }
 
   

    return (
        <>
            {user ? (
    <div className="profile bg-dark">
        <nav className="text-center">
            <img src={logo} alt="Logo" />
            {/*  post uploading loader */}
          
            {loading && (<span className="load"></span>)}

         


        </nav>

        {/* Offcanvas for User Profile */}
        <div className="offcanvas offcanvas-end bgColor text-white" tabIndex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
            <div className="offcanvas-header mb-3">
            <div className='d-flex align-items-center justify-content-between flex-wrap w-100 mt-5'>
  <h5 className="offcanvas-title mb-2 mb-md-0" id="offcanvasRightLabel">
    &nbsp; {user.displayName}
  </h5>
  <img src={user.photoURL} alt="" className="img-fluid" style={{ maxWidth: '50px', borderRadius: '50%' }} />
</div>

               
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body">
            {/* User's Bio */ }
            



                {/* User's Posts */}
                <div className="accordion " id="accordionExample">
  <div className="accordion-item">
    <h2 className="accordion-header">
      <button className="accordion-button" style={{background: 'transparent', color: 'red'}} type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
        Posts
      </button>
    </h2>
    <div id="collapseOne" className="accordion-collapse collapse show" data-bs-parent="#accordionExample">
      <div className="accordion-body " style={{background: '#212529'}}>

      <div className="container userPost rounded-3">

                    
{userPost.length > 0 ? (
    <div className="row">
        {userPost.map((post, index) => (
            <div key={index} className="card mb-3 bg-dark text-white">
                <div className="card-header d-flex align-items-center">
                    <img src={post.photoURL} alt={post.displayName} className="rounded-circle me-3" style={{ width: "50px" }} />
                    <h5 className="mb-0">{post.displayName}</h5>
                </div>
                <div className="card-body userPostData">
                    <p className="card-text">{post.text}</p>
                    {post.postImg && (
              isMediaUrl(post.postImg, 'mp3') ? (
              <audio controls loop>
              <source src={post.postImg} />
              </audio>
              ) : isMediaUrl(post.postImg, 'mp4') ? (
              <video  controls loop>
              <source  src={post.postImg} />
              </video>
              ) : (
            <img style={postPhotoStyle} src={post.postImg} alt="uploaded content" />
            )
            )}
                    <div className="d-flex justify-content-between">
                        <span>
                            <i className="fa-solid fa-heart text-danger"></i> {post.likesCount} Likes
                        </span>
                        <span>
                            <button className="btn btn-primary rounded-pill position-relative" data-bs-toggle="collapse" href={`#collapseExample${index}`} role="button" aria-expanded="false" aria-controls="collapseExample">
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            {post.commentsCount}</span>
                               { /* <i className="fa-regular fa-comment"></i> {post.commentsCount} Comments */ }
                               Comments
                            </button>
                        </span>
                    </div>
                </div>
                <div className="collapse" id={`collapseExample${index}`}>
                    {post.comments.length > 0 && (
                        <ul className="list-group list-group-flush">
                            {post.comments.map((comment, idx) => (
                                <li key={idx} className="list-group-item bg-dark text-white border-0 d-flex align-items-center">
                                    <img src={comment.photo} alt={comment.name} className="rounded-circle me-2" style={{ width: "30px" }} />
                                    <strong>{comment.name}:</strong> <span className="ms-2">{comment.comment}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        ))}
    </div>
) : (
    <span>No Posts</span>
)}
</div>


       </div>
    </div>
  </div>
  </div>


                
                

                <button className="btn btn-secondary mt-3" onClick={logout}>Log Out</button>
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
                    <div><img src={user.photoURL} alt={user.displayName} className="rounded-circle" /></div>
                    <div className="body">
                        <h5>{user.displayName}</h5>
                        <input
                            type="text"
                            value={text}
                            placeholder="Start a ripple..."
                            onChange={(e) => setText(e.target.value)}
                            className="form-control my-2"
                        />
                        <input type="file" onChange={handleFileChange} className="form-control" />
                    </div>
                    {text && (
                        <button
                            onClick={createPost}
                            id="post"
                            type="button"
                            className="btn btn-primary mt-2"
                        >
                            Post
                        </button>
                    )}
                </div>
            </div>
        </div>

        <ChakraProvider>
            {/* Post Field */}
            {posts ? (
                <div className="container">
                    {posts.map((post) => (
                        <div key={post.id} className="post mb-5">
                            <div>
                               
                            </div>
                            <div className="post-body">
                                <div className=' rfx'>
                                <img className="userPhoto rounded-circle" src={post.photoURL} alt={post.displayName} style={{ width: "50px" }} />
                                <h5>{post.displayName}</h5>
                                  </div>
                          
                                <p>{post.text}</p>
                                {post.postImg && (
                                  isMediaUrl(post.postImg, 'mp3') ? (
                                  <audio controls loop>
                                  <source src={post.postImg} />
                                  </audio>
                                  ) : isMediaUrl(post.postImg, 'mp4') ? (
                                  <video  controls loop>
                                  <source  src={post.postImg} />
                                  </video>
                                  ) : (
                                <img style={postPhotoStyle} src={post.postImg} alt="uploaded content" />
                                )
                                )}
                                <div className="d-flex justify-content-between mt-2">
                                    <p>
                                        {post.likesCount} &nbsp;
                                        <i
                                            onClick={() => handleLike(post.id, post.likedBy || [])}
                                            className={`fa-regular fa-heart ${post.likedBy?.some(like => like.uid === user.uid) ? "disabled fa-solid text-danger" : ""}`}
                                            style={{ cursor: post.likedBy?.some(like => like.uid === user.uid) ? "not-allowed" : "pointer" }}
                                        ></i>
                                    </p>
                                    <p>
                                        {post.commentsCount} &nbsp;
                                        <i
                                            onClick={() => openCommentModal(post.id)}
                                            className="fa-regular fa-comment"
                                            style={{ cursor: "pointer" }}
                                        ></i>
                                    </p>
                                </div>
                            </div>
                        </div>
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
        </ChakraProvider>

        <ToastContainer />
    </div>
) : (
    <div className="loader"></div>
)}

        </>
    );
}

export default Profile;
