import {constant} from "./constant.js";

/**
 * request 전송
 * @param {string} url
 * @param {string} method
 * @param {Object?} body
 * @return {Promise<{result: {msg, code}, data, isSuccess: boolean}>}
 */
const sendRequest = async (url, method, body=undefined) =>{
    return new Promise(resolve =>{

        const myHeaders = {
            'Content-Type': 'application/json',
        }


        if(body) console.log("requestBody\n", url, body)
        else console.log("request", url)

        body = body ? checkType(body) : undefined
        url = constant.baseUrl + url
        const myInit  = {method: method, body: body, headers: myHeaders}

        fetch(url, myInit)
            .then(async res => {
                res = await res.json()
                console.log("response", res)
                resolve(res)
            }).catch(error => {
            resolve(false)
            console.error(error);
        })
    })
}
function checkType(data){
    if(typeof(data) == 'object') return JSON.stringify(data)
}

export default class API{

    /**
     * @param {{lastChatId: string, data:{string, string}[]}} data
     */
    static sendChat = async (data) =>{
        await sendRequest('/data/chat', 'post', data)
    }

    static getBidNow = async () => {
        return await sendRequest('/data/bidNow', 'get')
    }

}