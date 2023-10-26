"use client"
import {
  CallEndIcon,
  MicIcon,
  MicSlashIcon,
  ScreenShareIcon,
  StopIcon,
  StopScreenShareIcon,
  VideoCamIcon,
  VideoSlashIcon,
  VolumeHighIcon,
} from "@/constants/icon-constant"
import {
  addScreenSharingHandler,
  changeCallSettingHandler,
  removeScreenSharingHandler,
} from "@/redux/actions/call-setting-action/call-setting-action"
import { useAppDispatch } from "@/store"
import React, { FC, useState } from "react"

const VideoCallControllBar = () => {
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false)
  const [isVideoRecording, setIsVideoRecording] = useState<boolean>(false)
  const [isAudioRecording, setIsAudioRecording] = useState<boolean>(false)
  const dispatch = useAppDispatch()

  const soundInputRangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {}
  const screenShareButtonHandler = () => {
    if (isScreenSharing) dispatch(removeScreenSharingHandler())
    else dispatch(addScreenSharingHandler())
    setIsScreenSharing(!isScreenSharing)
  }

  const callEndButtonHandler = () => {}

  const videoButtonHandler = () => {
    if (isVideoRecording) dispatch(changeCallSettingHandler({ isAllowedCamara: false }))
    else dispatch(changeCallSettingHandler({ isAllowedCamara: true }))
    setIsVideoRecording(!isVideoRecording)
  }

  const audioButtonHandler = () => {
    if (isAudioRecording) dispatch(changeCallSettingHandler({ isAllowedMicrophone: false }))
    else dispatch(changeCallSettingHandler({ isAllowedMicrophone: true }))
    setIsAudioRecording(!isAudioRecording)
  }

  return (
    <div className="mt-5 relative flex items-center">
      <div className="gap-2 absolute flex items-center">
        <div className="w-6 relative overflow-hidden flex items-center justify-center aspect-square rounded-full  fill-slate-950 dark:fill-slate-50">
          <VolumeHighIcon className="aspect-square w-6" />
        </div>
        <div className="w-24 flex items-center">
          <input
            type="range"
            className="transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-neutral-200 dark:bg-neutral-600"
            min={0}
            max={100}
            onChange={soundInputRangeHandler}
          />
        </div>
      </div>

      <div className="gap-8 mx-auto flex items-center">
        <VideoCallControllIcon onClickHandler={audioButtonHandler}>
          {isAudioRecording ? (
            <MicIcon className="aspect-square w-6" />
          ) : (
            <MicSlashIcon className="aspect-square w-6" />
          )}
        </VideoCallControllIcon>
        <VideoCallControllIcon onClickHandler={videoButtonHandler}>
          {isVideoRecording ? (
            <VideoSlashIcon className="aspect-square w-6" />
          ) : (
            <VideoCamIcon className="aspect-square w-6" />
          )}
        </VideoCallControllIcon>
        <VideoCallControllIcon onClickHandler={screenShareButtonHandler}>
          {isScreenSharing ? (
            <ScreenShareIcon className="aspect-square w-6" />
          ) : (
            <StopScreenShareIcon className="aspect-square w-6" />
          )}
        </VideoCallControllIcon>
        <VideoCallControllIcon>
          <CallEndIcon className="aspect-square w-6" />
        </VideoCallControllIcon>
        <VideoCallControllIcon className="dark:bg-red-500 bg-red-500" onClickHandler={callEndButtonHandler}>
          <CallEndIcon className="aspect-square w-6" />
        </VideoCallControllIcon>
      </div>
    </div>
  )
}

export default VideoCallControllBar

interface VideoCallControllIconProps {
  children: React.ReactNode
  className?: string
  onClickHandler(): void
}
const VideoCallControllIcon: FC<VideoCallControllIconProps> = ({ children, className, onClickHandler }) => {
  return (
    <div
      className={
        "w-10 relative overflow-hidden flex items-center justify-center aspect-square rounded-full bg-slate-300 fill-slate-950 dark:fill-slate-50 dark:bg-neutral-900 " +
        (className != undefined ? className : "")
      }
      onClick={onClickHandler}
    >
      {children}
    </div>
  )
}
