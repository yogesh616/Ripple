import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';


function UserBio() {
    const { userDisplayName } = useParams();
    const decodedDisplayName = decodeURIComponent(userDisplayName);
    const [userPost, setUserPost] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserPosts = async () => {
            try {
                // Fetch user ID based on displayName
                const userQuery = query(collection(db, 'users'), where('displayName', '==', decodedDisplayName));
                const userSnapshot = await getDocs(userQuery);
                
                if (userSnapshot.empty) {
                    console.log('No user found with displayName:', decodedDisplayName);
                    setLoading(false);
                    return;
                }
                
                const userDoc = userSnapshot.docs[0];
                const userId = userDoc.id;

                // Fetch posts for the user
                const postCollection = collection(db, 'posts');
                const q = query(postCollection, where('uid', '==', userId), orderBy('timestamp'));

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const userPostsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    setUserPost(userPostsData);
                    setLoading(false);
                });

                return () => unsubscribe();

            } catch (error) {
                console.error('Error fetching user posts:', error);
                setLoading(false);
            }
        };

        fetchUserPosts();
    }, [decodedDisplayName]);

    if (loading) {
        return <div>Loading...</div>;
    }


   
    return (
        <div>
            <h1>{decodedDisplayName}'s Posts</h1>
            {userPost.length === 0 ? (
                <p>No posts found.</p>
            ) : (
                <ul>
                    {userPost.map(post => (
                        <li key={post.id}>
                            <p>{post.text}</p>
                            {post.postImg && <img src={post.postImg} alt="Post" style={{ borderRadius: '15px', maxWidth: '10rem', padding: '0.25rem', objectFit: 'cover' }} />}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default UserBio;
