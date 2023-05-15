const {google} = require('googleapis');

const axios = require('axios')

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


    test = async () =>{
        try {
            await this.#getChatId()
            await this.getChat()

            return true
        }catch (e) {

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
            console.log(e)
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

        }catch (e) {
            console.log("getChatId", e)
            return false
        }
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
        }catch (e) {
            console.log(e)
            return false
        }
    }

}
const youtubeService = new YoutubeService()
module.exports = youtubeService