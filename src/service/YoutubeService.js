const {google} = require('googleapis');

const axios = require('axios')
const {sseManager, sseType} = require("../data/SSEManager");

class YoutubeService{

    apikey = "AIzaSyDa6QlCp4Am0in25vTFRVKxlWfdfoeW9dM"
    #chatId

    tokenId
    broadcastId
    #pagToken = ''

    setId = async (tokenId, broadcastId) =>{
        this.tokenId = tokenId
        this.broadcastId = broadcastId
        await this.#getChatId()
    }

    setTokenId = (tokenId) =>{
        this.tokenId = tokenId
        setTimeout(()=>{
            sseManager.pushAll(sseType.login, {})
        }, 50 * 1000 * 60)
    }

    test = async () =>{
        try {
            if(!await this.#getChatId()) {
                console.log("getChatId False")
                return false
            }
            if(!await this.getChat()){
                console.log("getChat False")
                return false
            }
            return true
        }catch (e) {

            return false
        }
    }

    getBroadCast = async () =>{
        const url = `https://youtube.googleapis.com/youtube/v3/liveBroadcasts?key=${this.apikey}&broadcastStatus=active`

        try {
            const res = await axios.get(url, {
                headers:{
                    Authorization: `Bearer ${this.tokenId}`,
                    Accept: "application/json"
                }})

            console.log(res.data)
            return res.data

        }catch (e) {
            console.log("Error getBroadCast")
            console.log(e.statusCode)
            console.log(e.errorMessage)
            return false
        }
    }

    getChat = async () =>{
        const url = `https://youtube.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${this.#chatId}&part=snippet%2CauthorDetails&key=${this.apikey}&pageToken=${this.#pagToken}`
        try {
            const res = await axios.get(url, {
                headers:{
                    Authorization: `Bearer ${this.tokenId}`,
                    Accept: "application/json"
                }})

            if(res.data.nextPageToken) {
                this.#pagToken = res.data.nextPageToken
            }

            // console.log(res.data)
            return res.data

        }catch (e) {
            console.log("Error getChat")
            console.log(e.statusCode)
            console.log(e.errorMessage)
            this.tokenId = undefined
            sseManager.pushAll(sseType.reset, {})
            return false
        }
    }

    #getChatId = async () =>{
        const url = `https://youtube.googleapis.com/youtube/v3/liveBroadcasts?part=snippet%2CcontentDetails%2Cstatus&id=${this.broadcastId}&key=${this.apikey}`
        try {
            const res = await axios.get(url, {
                headers:{
                    Authorization: `Bearer ${this.tokenId}`,
                    Accept: "application/json"
                }})

            const data = res.data.items[0]
            // console.log(res.data.items[0])
            this.#chatId = data.snippet.liveChatId
            return true

        }catch (e) {
            console.log("Error getChatId")
            console.log(e.statusCode)
            console.log(e.errorMessage)
            return false
        }
    }

    resetPageToken = () =>{
        this.#pagToken = ``
    }

    sendMessage = async text =>{
        try {
            await axios.post(`https://youtube.googleapis.com/youtube/v3/liveChat/messages?part=snippet&key=${this.apikey}`,
                {
                    "snippet": {
                        "liveChatId": this.#chatId,
                        "type": "textMessageEvent",
                        "textMessageDetails": {
                            "messageText": text
                        }
                    }
                } ,
                {
                    headers:{
                        Authorization: `Bearer ${this.tokenId}`,
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                })

            return true
        }catch (e) {
            console.log("Error sendMessage")
            console.log(e.statusCode)
            console.log(e.errorMessage)
            return false
        }
    }

    clear = () =>{
        this.apikey = undefined
        this.tokenId = undefined
        this.#chatId = undefined
        this.broadcastId = undefined
        this.#pagToken = ''
    }

}
const youtubeService = new YoutubeService()
module.exports = youtubeService