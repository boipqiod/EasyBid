import Util from "./Util.js";
import API from "./API.js";

class MessageController {

    #input
    #button
    #clickEvent = new Event("click", {bubbles: true})
    #inputEvent = new Event("input", {bubbles: true})
    #keyDownEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        keyCode: 13, // For older browsers
        which: 13, // For older browsers
        code: "Enter",
        bubbles: true,
        cancelable: true
    })

    #lastChatId
    #start = false

    #ChatTimer

    /**@type {string[]} */
    #chatList = []

    init = async (input, button) => {
        this.#input = input
        this.#button = button

        console.log(input)
        console.log(button)
        const res = await API.getBidNow()

         this.#lastChatId = res.lastChatId
        if(res.isOnSale) {
            this.#start = true
            await this.startTime()
        }
        this.#startSendChatTimer()
    }

    #startSendChatTimer = () =>{
        this.#ChatTimer = setInterval(()=>{
            if(this.#chatList.length){
                this.sendMessage(this.#chatList.shift()).then()
            }
        }, 500)
    }

    pushMessage = (message) =>{
        this.#chatList.push(message)
    }

    startGetChat = () => {
        this.#start = true
        this.setLastId().then(()=>{
            this.startTime().then()
        })
    }

    startTime = async () =>{
        await Util.setDelay(1000)

        const list = await this.getChat()
        if (list && list.length !== 0) {
            await API.sendChat({
                lastChatId: this.#lastChatId,
                data: list
            })
            console.log(this.#start = true)
        }

        if(this.#start) {
            await this.startTime()
        }
    }

    endGetChat = () => {
        this.#start = false
    }

    sendMessage = async (message) => {
        console.log(`MessageController sendMessage ${message}`)
        this.#input.focus()
        this.#input.textContent = message
        this.#input.dispatchEvent(this.#inputEvent)
        this.#input.dispatchEvent(this.#keyDownEvent)

        this.#button.click()
        this.#button.dispatchEvent(this.#clickEvent)
    }

    setLastId = () =>{
        const getId = () =>{
            const nodeList = document.querySelectorAll('yt-live-chat-text-message-renderer')
            let chatList = Array.from(nodeList)
            return chatList[chatList.length - 1].id
        }

        return new Promise(async resolve => {
            const t = setInterval(()=>{
                const id = getId()

                console.log("setLastId", id)
                if(id.substring(0, 5) === 'ChwKG') {
                    this.#lastChatId = id
                    clearInterval(t)
                    resolve()
                }
            },100)
        })
    }

    getChat = async () => {
        try {
            const nodeList = document.querySelectorAll('yt-live-chat-text-message-renderer')
            let chatList = Array.from(nodeList)

            if (this.#lastChatId) {
                const lastChatIndex = chatList.findIndex(chat => chat.id === this.#lastChatId);
                if(lastChatIndex !== -1) {
                    chatList = chatList.slice(lastChatIndex + 1);
                }
            }

            const resList = []
            for (const item of chatList) {
                const data = this.#getNameAndMessage(item)
                if (data) resList.push(data)
            }

            await Util.setDelay(2000)
            await this.setLastId()

            return resList
        } catch (e) {
            console.log(e)
        }
    }
    #getNameAndMessage = (chat) => {
        const name = chat.childNodes[3].childNodes[1].childNodes[3].textContent
        const message = chat.childNodes[3].childNodes[3].textContent
        if (Util.isNumericString(message)) {
            return {
                name,
                message: parseInt(message)
            }
        } else {
            return null
        }
    }

}

export default new MessageController()