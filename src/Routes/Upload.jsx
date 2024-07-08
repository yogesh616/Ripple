import React, { useEffect } from 'react';
import * as mm from 'music-metadata-browser';

function Upload() {
  const checkFile = async () => {
    const fileUrl = 'https://firebasestorage.googleapis.com/v0/b/threads-12bd6.appspot.com/o/uploads%2FCalifornia%20Love(PagalWorld.com.cm).mp3?alt=media&token=3b52c5a0-6163-4522-acd1-2399953669f4';
    
    try {
      // Fetch the file as a Blob
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      // Parse the Blob using music-metadata-browser
      const metadata = await mm.parseBlob(blob);
      console.log(metadata);
    } catch (error) {
      console.error('Error reading metadata:', error.message);
    }
  };

  useEffect(() => {
    checkFile();
  }, []);

  return (
    <div>
      <h1>Check MP3 File</h1>
    </div>
  );
}

export default Upload;
