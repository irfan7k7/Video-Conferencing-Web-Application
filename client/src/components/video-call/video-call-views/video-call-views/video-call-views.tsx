"use client"
import React, { FC, useState } from "react"

interface VideoCallViewsProps {
  myVideoRef: React.MutableRefObject<HTMLVideoElement | undefined>
  setIsShowingliveChat: React.Dispatch<React.SetStateAction<boolean>>
}
const VideoCallViews: FC<VideoCallViewsProps> = ({ myVideoRef, setIsShowingliveChat }) => {
  const [isPinnedVideo, setIsPinnedVideo] = useState<boolean>(false)
  const [videoSize, setVideoSize] = useState<{ width: number; height: number }>({ height: 45, width: 40 })
  const videoOnClickHandler = () => {
    setIsPinnedVideo(true)
    setVideoSize({ width: 100, height: 100 })
    setIsShowingliveChat(false)
  }
  return (
    <div className="mt-5 flex-1">
      <div className="relative gap-5  flex  flex-wrap justify-center  h-full">
        {!isPinnedVideo && (
          <>
            <div className="h-[45%] rounded-2xl w-[40%] bg-neutral-600 ">
              <video autoPlay className="w-full h-full" />
            </div>
            <div className="h-[45%] rounded-2xl w-[40%] bg-neutral-600 ">
              <video autoPlay className="w-full h-full" />
            </div>
          </>
        )}
        <div
          className={`h-[${videoSize.height}%] rounded-2xl w-[${videoSize.width}%] bg-neutral-600 `}
          onClick={videoOnClickHandler}
        >
          <video autoPlay ref={ref => {if(myVideoRef != undefined)ref.srcObject = myVideoRef}} className="w-full h-full" />
        </div>
        {/* <div className=" aspect-video rounded-2xl w-[40%] bg-neutral-600">
          <video autoPlay ref={props.userVideoRef} className="w-full h-full"  />
        </div>
        <div className=" aspect-video rounded-2xl w-[40%] bg-neutral-600">
          <video autoPlay ref={props.userVideoRef} className="w-full h-full"  />
        </div>
        <div className=" aspect-video rounded-2xl w-[40%] bg-neutral-600">
          <video autoPlay ref={props.userVideoRef} className="w-full h-full"  />
        </div> */}
      </div>
    </div>
  )
}

export default VideoCallViews
