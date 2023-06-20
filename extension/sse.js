import {constant} from "./constant.js";

export default class SSE {

    /**
     * @type {EventSource}
     */
    static #eventSource
    static #baseUrl = constant.baseUrl

    static sseType = {
        session: "session",
        message: "message",
        startSale: "startSale",
        endSale: "endSale",
        sale: "sale",
        saleClient: "saleClient",
        reset: "reset",
        login: "login"
    }

    /**
     * @param {(this:EventSource, ev: EventSourceEventMap[string]) => any} receivedSSE
     */
    static initSSE = receivedSSE =>{
        this.#eventSource = new EventSource(`${this.#baseUrl}/sse/events`)
        console.log("SSE INIT")
        console.log(this.#eventSource)
        // 서버로부터 데이터가 오면
        this.#eventSource.addEventListener('message', receivedSSE)
        // error 나면
        this.#eventSource.addEventListener('error', ()=>{
            this.#eventSource = new EventSource(`${this.#baseUrl}/sse/events`)
        })
    }

}