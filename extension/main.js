import SSE from "./sse.js";
import messageController from './MessageController.js'

const init = async () =>{

    // const button = document.querySelector("#send-button button")
    // const input = document.querySelector("#input-container #input #input")
    //
    // input.focus()
    // input.textContent = "message"
    // input.dispatchEvent(new Event("input", {bubbles: true}))
    //
    // setInterval(()=>{
    //     button.click()
    // }, 500)

    sseInit()
    await messageController.init(
        document.querySelector("#input-container #input #input"),
        document.querySelector("#send-button button")
    )
}

const sseInit = () =>{
    SSE.initSSE((e)=>{

        try {
            const receivedData = JSON.parse(e.data)

            console.log(receivedData)

            switch (receivedData.type){
                case SSE.sseType.session: return
                case SSE.sseType.message:
                    messageController.pushMessage(receivedData.data.message)
                    return
                case SSE.sseType.startSale:
                    messageController.startGetChat()
                    return
                case SSE.sseType.endSale:
                    messageController.endGetChat()
                    return
            }
        }catch (e){

            console.log("sse error", e)

        }

    })
}

init().then(() => {
    console.log("init complete")
})