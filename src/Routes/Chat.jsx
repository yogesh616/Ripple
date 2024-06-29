import React, { useEffect, useContext } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

function Chat() {
    useEffect(() => {
        const postCollection = collection(db, 'posts');
        const q = query(postCollection, orderBy('timestamp'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            
            console.log(postsData)
            
            
           
            
        });

        return () => unsubscribe();
    }, []);

     // Include userID in the dependency array to react to changes

    return (
        <div>
           
        </div>
    );
}

export default Chat;
