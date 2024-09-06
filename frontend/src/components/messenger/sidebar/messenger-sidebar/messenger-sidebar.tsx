import React, { FC, useState } from "react"
import Recent from "../../recent/recent"
import MessengerSort from "../../messenger-sort/messenger-sort"
import ChatList from "../../chat-list/chat-list"
import AddButton from "../../add-button/add-buttton"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageCircle, Plus, Users } from "lucide-react"
import GroupCreationForm from "../../form/group-creation-form/group-creation-form"
import FreindRequestForm from "../../form/freind-request-form/freind-request-form"

interface MessengerSidebarProps {
  isInitialRender: boolean
}
const MessengerSidebar: FC<MessengerSidebarProps> = ({ isInitialRender }) => {
  const [isButtonClicked, setIsButtonClicked] = useState<boolean>(false)
  const [popUpForm, setPopUpForm] = useState<"newChat" | "newGroup" | "newContact" | undefined>(undefined)

  const addButtonClickHandler = () => setIsButtonClicked(!isButtonClicked)
  const popUpFromSelectHandler = (selectedFrom: "newChat" | "newGroup" | "newContact" | undefined) => {
    if (popUpForm == selectedFrom) return setPopUpForm(undefined)
    else setPopUpForm(selectedFrom)
  }
  return (
    <>
      <AnimatePresence>
        <motion.div
          key={"sidebarNotification"}
          initial={{ translateX: !isInitialRender ? "-100%" : "0%" }}
          animate={{ translateX: "0%" }}
          exit={{ translateX: "-100%" }}
          transition={{ duration: 0.4 }}
          className=" h-full w-auto "
        >
          <Recent />
          <div className="mt-10 flex flex-col overflow-y-scroll h-[70vh] no-scrollbar">
            <MessengerSort />
            <ChatList />
          </div>
          <div>
            <div
              className="absolute bottom-5 rounded-full right-4 w-10 aspect-square bg-blue-500 fill-slate-50 flex items-center justify-center"
              onClick={addButtonClickHandler}
            >
              <Button className="relative w-full h-full" rounded size={"icon"}>
                <Plus className="aspect-square w-6" />
              </Button>

              {isButtonClicked && (
                <div className="absolute gap-3 px-2 py-2 right-0 translate-y-[-70%] w-36 z-30 flex flex-col  bg-background-primary text-sm">
                  <div className="relative flex items-center justify-end">
                    <span>New Chat</span>
                    <div
                      className="relative w-10 flex justify-center items-center aspect-square rounded-full"
                      style={{ background: "rgba(28,157,234,.15)" }}
                      onClick={() => popUpFromSelectHandler("newChat")}
                    >
                      <MessageCircle className="w-6 aspect-square" width="" height="" />
                    </div>
                  </div>
                  <div className="relative flex items-center justify-end">
                    <span>New Group</span>
                    <div
                      className="relative w-10 flex justify-center items-center aspect-square rounded-full"
                      style={{ background: "rgba(28,157,234,.15)" }}
                      onClick={() => popUpFromSelectHandler("newGroup")}
                    >
                      <Users className="w-6 aspect-square" width="" height="" />
                    </div>
                  </div>
                  <div className="relative flex items-center justify-end">
                    <span>New Contact</span>
                    <div
                      className="relative w-10 flex justify-center items-center aspect-square rounded-full"
                      style={{ background: "rgba(28,157,234,.15)" }}
                      onClick={() => popUpFromSelectHandler("newContact")}
                    >
                      <Users className="w-6 aspect-square" width="" height="" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {popUpForm == "newGroup" && <GroupCreationForm handleOutsideClick={() => setPopUpForm(undefined)} />}
      {popUpForm == "newChat" && <FreindRequestForm handleCloseButtonClick={() => setPopUpForm(undefined)} />}
    </>
  )
}

export default MessengerSidebar
