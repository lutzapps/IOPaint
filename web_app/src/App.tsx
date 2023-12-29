import { useCallback, useEffect, useMemo, useRef } from "react"
import { nanoid } from "nanoid"

import useInputImage from "@/hooks/useInputImage"
import { keepGUIAlive } from "@/lib/utils"
import { getServerConfig } from "@/lib/api"
import Header from "@/components/Header"
import Workspace from "@/components/Workspace"
import FileSelect from "@/components/FileSelect"
import { Toaster } from "./components/ui/toaster"
import { useStore } from "./lib/states"
import { useWindowSize } from "react-use"

const SUPPORTED_FILE_TYPE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
]
function Home() {
  const [file, updateAppState, setServerConfig, setFile] = useStore((state) => [
    state.file,
    state.updateAppState,
    state.setServerConfig,
    state.setFile,
  ])

  const userInputImage = useInputImage()

  const windowSize = useWindowSize()

  useEffect(() => {
    if (userInputImage) {
      setFile(userInputImage)
    }
  }, [userInputImage, setFile])

  useEffect(() => {
    updateAppState({ windowSize })
  }, [windowSize])

  useEffect(() => {
    const fetchServerConfig = async () => {
      const serverConfig = await getServerConfig().then((res) => res.json())
      setServerConfig(serverConfig)
      if (serverConfig.isDesktop) {
        // Keeping GUI Window Open
        keepGUIAlive()
      }
    }
    fetchServerConfig()
  }, [])

  const workspaceId = useMemo(() => {
    return nanoid()
  }, [file])

  const dragCounter = useRef(0)

  const handleDrag = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragIn = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current += 1
  }, [])

  const handleDragOut = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current > 0) return
  }, [])

  const handleDrop = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      if (event.dataTransfer.files.length > 1) {
        // setToastState({
        //   open: true,
        //   desc: "Please drag and drop only one file",
        //   state: "error",
        //   duration: 3000,
        // })
      } else {
        const dragFile = event.dataTransfer.files[0]
        const fileType = dragFile.type
        if (SUPPORTED_FILE_TYPE.includes(fileType)) {
          setFile(dragFile)
        } else {
          // setToastState({
          //   open: true,
          //   desc: "Please drag and drop an image file",
          //   state: "error",
          //   duration: 3000,
          // })
        }
      }
      event.dataTransfer.clearData()
    }
  }, [])

  const onPaste = useCallback((event: any) => {
    // TODO: when sd side panel open, ctrl+v not work
    // https://htmldom.dev/paste-an-image-from-the-clipboard/
    if (!event.clipboardData) {
      return
    }
    const clipboardItems = event.clipboardData.items
    const items: DataTransferItem[] = [].slice
      .call(clipboardItems)
      .filter((item: DataTransferItem) => {
        // Filter the image items only
        return item.type.indexOf("image") !== -1
      })

    if (items.length === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    // TODO: add confirm dialog

    const item = items[0]
    // Get the blob of image
    const blob = item.getAsFile()
    if (blob) {
      setFile(blob)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("dragenter", handleDragIn)
    window.addEventListener("dragleave", handleDragOut)
    window.addEventListener("dragover", handleDrag)
    window.addEventListener("drop", handleDrop)
    window.addEventListener("paste", onPaste)
    return function cleanUp() {
      window.removeEventListener("dragenter", handleDragIn)
      window.removeEventListener("dragleave", handleDragOut)
      window.removeEventListener("dragover", handleDrag)
      window.removeEventListener("drop", handleDrop)
      window.removeEventListener("paste", onPaste)
    }
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-between w-full">
      <Toaster />
      <Header />
      <Workspace key={workspaceId} />
      {!file ? (
        <FileSelect
          onSelection={async (f) => {
            setFile(f)
          }}
        />
      ) : (
        <></>
      )}
    </main>
  )
}

export default Home
