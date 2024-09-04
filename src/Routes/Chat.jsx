import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, Timestamp, query, where, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Popover } from 'react-tiny-popover';
import sendIcon from '../assets/send.png';
import avatar from '../assets/user.png';
import '../index.css';
import './chat.css';
import { color } from 'framer-motion';

function Chat() {
    const [user, setUser] = useState(null);
    const [userList, setUserList] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [popoverOpen, setPopoverOpen] = useState({});
    const messageContainerRef = useRef(null);
    const side1Ref = useRef(null);
    const side2Ref = useRef(null);

    // Handle user authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                try {
                    const userListRef = await getDocs(collection(db, 'users'));
                    const users = [];
                    userListRef.forEach(doc => users.push({ ...doc.data(), uid: doc.id }));
                    setUserList(users);
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            } else {
                setUser(null);
                setUserList([]);
            }
        });

        return () => unsubscribe();
    }, []);

    // Fetch messages between the authenticated user and the selected user
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
                    msgs.push({ id: doc.id, ...doc.data() }); // Include document ID
                });
                setMessages(msgs);
            });
            

            return () => unsubscribe();
        }
    }, [selectedUser, user]);

    // Scroll to the latest message when the messages array changes
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTo({ top: messageContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    // Handle showing and hiding the chat container on mobile screens
    const handleChatContainer = () => {
        if (window.innerWidth <= 768) {
            side1Ref.current.style.display = 'none';
            side2Ref.current.style.display = 'flex';
        }
    };

    const handleCloseChatContainer = () => {
        if (window.innerWidth <= 768) {
            side1Ref.current.style.display = 'block';
            side2Ref.current.style.display = 'none';
        }
    };

    // Send a message to the selected user
    const sendMessage = async (receiverId) => {
        if (message.trim()) {
            await addDoc(collection(db, 'messages'), {
                senderId: user.uid,
                receiverId: receiverId,
                message: message,
                timestamp: Timestamp.now(),
            });
            setMessage('');
        }
    };
     // Delete a message
     const deleteMessage = async (messageId) => {
        if (messageId) {
            try {
                await deleteDoc(doc(db, 'messages', messageId));
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }
    };


    return (
        <div className="chat-page">
            {user ? (
                <div className="chatMain">
                    <div ref={side1Ref} className="side1">
                        <ul className="list-group ulList">
                            {userList.map((u) => (
                                <li
                                    key={u.uid}
                                    onClick={() => {
                                        setSelectedUser(u);
                                        setActiveChat(u);
                                        handleChatContainer(); // Show chat on mobile
                                    }}
                                >
                                    <img src={u.photoURL || avatar} onError={(e) => (e.target.src = avatar)} alt="User" />
                                    <strong>{u.displayName || 'Tester'}</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div ref={side2Ref} className="side2">
                        {activeChat ? (
                            <>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <img src={activeChat.photoURL || avatar} className="rounded-circle me-2" style={{ width: '50px' }} alt="User" />
                                        <strong className="username">{activeChat.displayName}</strong>
                                    </div>
                                    <button onClick={handleCloseChatContainer} type="button" className="btn-close ms-5" aria-label="Close"></button>
                                </div>
                                <div className="message-container" ref={messageContainerRef}>
                                    {messages
                                        .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)
                                        .map((msg, index) => (
                                            <div key={index} className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}>
                                                <Popover
                                                    isOpen={!!popoverOpen[index]}
                                                    positions={['left']}
                                                    content={<div className="p-2">
                                                    {msg.senderId === user.uid && (
                                                                <button 
                                                                    onClick={() => deleteMessage(msg.id)} 
                                                                    style={{ marginLeft: '10px', color: 'red', cursor: 'pointer', background: 'none', border: 'none'}}
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                    </div>}
                                                >
                                                    <p onClick={() => setPopoverOpen({ [index]: !popoverOpen[index] })}>{msg.message}</p>
                                                </Popover>
                                            </div>
                                        ))}
                                </div>
                                <div className="message-input-container">
                                    
                                    <div className="message-input">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Type a message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => sendMessage(activeChat.uid)} disabled={!message.trim()}>
                                        <img src={sendIcon} alt="Send" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center mt-5">
                                <h4 style={{color: '#e1e1e1', fontSize: '1.5rem'}}>Select a user to start chatting</h4>
                               
            
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                <div className='loadPage'>
                <span className="load"></span>
                </div>
                </>
            )}
        </div>
    );
}

export default Chat;
