import React from 'react'
import './upload.css';
function Upload() {
  const url = 'https://firebasestorage.googleapis.com/v0/b/threads-12bd6.appspot.com/o/uploads%2F_6ced560a-2867-489d-b3c9-10463d1d2d3e.jpeg?alt=media&token=405205db-2641-496b-b979-cace3f7c9368';

  return (
    <>
    <div className='upload'>
   
   <img src={url} alt="uploaded content" />
    </div>
     
    </>
  )
}

export default Upload
