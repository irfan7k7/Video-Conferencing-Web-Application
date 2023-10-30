"use client"
import {
  BellIcon,
  ChatIcon,
  FileIcon,
  GearIcon,
  IdBadgeIcon,
  LogoutIcon,
  MoonIcon,
  StarIcon,
  VideoCamIcon,
} from "@/constants/icon-constant"
import Image from "next/image"
import { FC } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { callReducerSlate } from "@/redux/reducers/call-reducer/call-reducer"

const SideMenu = () => {
  const { isAvailableCallRoom } = useSelector((state: { callRedcuer: callReducerSlate }) => state.callRedcuer)
  const router = useRouter()

  const videoCallButtonHandler = () => {
    if (isAvailableCallRoom) return router.push("/video-call")
    else return router.push("/create-video-call")
  }

  return (
    <div className="hidden  py-20 h-[90vh]  md:block   ">
      <div className="  h-full w-16  flex flex-col justify-between items-center   ">
        <div className="w-10 relative overflow-hidden flex items-center justify-center aspect-square rounded-full ">
          <Image alt="profile-image" src={"/Asset/avatar.jpg"} fill />
        </div>

        <SideMenuIcon onClickHandler={() => router.push("/messenger")}>
          <ChatIcon className="w-6 aspect-square" />
        </SideMenuIcon>
        <SideMenuIcon onClickHandler={videoCallButtonHandler}>
          <VideoCamIcon className="w-6 aspect-square" />
        </SideMenuIcon>
        <SideMenuIcon>
          <IdBadgeIcon className="w-6 aspect-square" />
        </SideMenuIcon>
        <SideMenuIcon>
          <BellIcon className="w-6 aspect-square" />
        </SideMenuIcon>
        <SideMenuIcon>
          <GearIcon className="w-6 aspect-square" />
        </SideMenuIcon>
        <SideMenuIcon>
          <LogoutIcon className="w-6 aspect-square" />
        </SideMenuIcon>
        <SideMenuIcon>
          <MoonIcon className="w-6 aspect-square" />
        </SideMenuIcon>
      </div>
    </div>
  )
}

export default SideMenu

interface SideMenuIconInterface {
  children: React.ReactNode
  onClickHandler?(): void
}
const SideMenuIcon: FC<SideMenuIconInterface> = ({ children, onClickHandler }) => {
  return (
    <div
      className="w-10 relative overflow-hidden flex items-center justify-center aspect-square rounded-full bg-slate-300 fill-slate-950 dark:fill-slate-50 dark:bg-neutral-900"
      onClick={onClickHandler}
    >
      {children}
    </div>
  )
}
