import React from 'react'
import { useParams } from 'react-router'
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'
import { Container } from '@chakra-ui/react'

function Call() {
    const { username, callId } = useParams()

    const myCalls = async (elem) => {
        const appID = 255651025;
        const serverSecret = '4c787a0007586d1877a6189ae4ca6d4f';
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, callId, Date.now().toString(), username);
        const zc = ZegoUIKitPrebuilt.create(kitToken);
        zc.joinRoom({
            container: elem,
            sharedLinks: [{
                name: 'Copy Link',
                url: `https://ripple-steel.vercel.app/call/${username}/${callId}`
            }],
            scenario: {
                mode: ZegoUIKitPrebuilt.OneONoneCall,

            },
            showScreenSharingButton: true,
    })
    
    }

  

  return (
    <>
  
    <div className='text-light'>
      <div ref={myCalls} />
    </div>
    </>
  )
}

export default Call
