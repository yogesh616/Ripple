import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, Timestamp, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import profilePic from '../assets/profile.png';
import '../index.css';
import { Link } from 'react-router-dom';
import { Popover } from 'react-tiny-popover';

function Chat() {
    const [user, setUser] = useState(null);
    const [userList, setUserList] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [popoverOpen, setPopoverOpen] = useState({});
    const messageContainerRef = useRef(null);
    const liTag = useRef(null);
    const side1 = useRef(null);
    const side2 = useRef(null);
    const backBtn = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                try {
                    const userListRef = await getDocs(collection(db, 'users'));
                    if (userListRef.empty) {
                        console.log('No users found.');
                    } else {
                        const users = [];
                        userListRef.forEach(doc => {
                            users.push(doc.data());
                        });
                        setUserList(users);
                        console.log(users);
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            } else {
                console.log('User is not logged in');
                setUser(null);
                setUserList([]);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (selectedUser && user) {
            const q = query(
                collection(db, 'messages'),
                where('senderId', 'in', [user.uid, selectedUser.uid]),
                where('receiverId', 'in', [user.uid, selectedUser.uid])
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const msgs = [];
                querySnapshot.forEach((doc) => {
                    msgs.push(doc.data());
                });
                setMessages(msgs);
                console.log('Messages:', msgs);
            });

            const fetchInitialMessages = async () => {
                const initialQuery = query(
                    collection(db, 'messages'),
                    where('senderId', 'in', [user.uid, selectedUser.uid]),
                    where('receiverId', 'in', [user.uid, selectedUser.uid])
                );
                const initialQuerySnapshot = await getDocs(initialQuery);
                const initialMessages = [];
                initialQuerySnapshot.forEach((doc) => {
                    initialMessages.push(doc.data());
                });
                setMessages(initialMessages);
                console.log('Initial Messages:', initialMessages);
            };
            fetchInitialMessages();

            return () => {
                unsubscribe();
            };
        }
    }, [selectedUser, user]);

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTo({ top: messageContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    function handleImgError(e) {
        e.target.src = profilePic;
    }

    async function sendMessage(receiverId) {
        if (user && receiverId) {
            try {
                await addDoc(collection(db, 'messages'), {
                    senderId: user.uid,
                    receiverId: receiverId,
                    message: message,
                    timestamp: Timestamp.now()
                });
                console.log('Message sent');
                setMessage(''); // Clear message input after sending
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }

    function handleActiveChat(user) {
        setActiveChat(user);
        console.log('Active chat:', user);
    }

    function togglePopover(index) {
        setPopoverOpen(prevState => ({
            ...prevState,
            [index]: !prevState[index]
        }));
    }

    function handleChatContainer () {
        side1.current.style.display  = 'none';
        side2.current.style.display  = 'flex';
        side2.current.style.width = '100vw';
        backBtn.current.style.display = 'none';

    }
    
    function handleCloseChatContainer () {
        side1.current.style.display  = 'block';
        side1.current.style.width = '100vw';
        side2.current.style.display  = 'none';
        backBtn.current.style.display = 'block';
       
    }

    return (
        <div className='chat-page'>
            {user ? (
                <div className='chatMain'>
                    <Link ref={backBtn} to='/profile' className="back-button"><i className="fa-solid fa-arrow-left"></i></Link>
                    <div className='side1' ref={side1}>
                        <ul className="list-group ulList">
                            {userList.map((u, index) => (
                                <li  ref={liTag}
                                    onClick={() => { 
                                        setSelectedUser(u);
                                        handleActiveChat(u);
                                        handleChatContainer();
                                    }}
                                    key={index}
                                    className="list-group-item text-light"
                                >
                                    <div className='d-flex align-items-center justify-content-start'>
                                        <img
                                            src={u.photoURL}
                                            className="rounded-circle me-2"
                                            style={{ width: "50px" }}
                                            onError={handleImgError}
                                        />
                                        <strong>{u.displayName}</strong>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="side2" ref={side2}>
                        {activeChat ? (
                            <div className='d-flex aligin-items-center justify-content-between'>
                                <div className='d-flex align-items-center'>
                                <img src={activeChat.photoURL} className="rounded-circle me-2" style={{ width: "50px" }} />
                                <strong>{activeChat.displayName}</strong>

                                   </div>
                                   <button onClick={handleCloseChatContainer} type="button" className="btn-close ms-5" aria-label="Close"></button> </div>
                          
                            
                        ) : (
                            <h1>Messages</h1>
                        )}

                        <div className="message-container" ref={messageContainerRef}>
                            {messages
                                .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)
                                .map((msg, index) => (
                                    <div key={index} className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}>
                                        <Popover
                                            isOpen={!!popoverOpen[index]}
                                            position={['top']}
                                            content={<div>{new Date(msg.timestamp.seconds * 1000).toLocaleString()}</div>}
                                        >
                                            <p onClick={() => togglePopover(index)}>
                                                {msg.message}
                                            </p>
                                        </Popover>
                                    </div>
                                ))}
                        </div>
                        {selectedUser && (
                            <div className="message-input-container">
                                <div className="message-input">
                                    <input 
                                        type="text" 
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)} 
                                        className="form-control" 
                                        placeholder="Type your message..."
                                    />
                                    <button onClick={() => sendMessage(selectedUser.uid)} className="btn btn-primary mt-2">
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p>Please log in</p>
            )}
        </div>
    );
}

export default Chat;
