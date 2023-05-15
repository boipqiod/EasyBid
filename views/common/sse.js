export default class SSE {

    /**
     * @type {EventSource}
     */
    static #eventSource

    /**
     * @param {(this:EventSource, ev: EventSourceEventMap[string]) => any} receivedSSE
     */
    static initSSE = receivedSSE =>{
        this.#eventSource = new EventSource("/sse/events")
        // 서버로부터 데이터가 오면
        this.#eventSource.addEventListener('message', receivedSSE)
        // error 나면
        // this.#eventSource.addEventListener('error', this.initSSE)
    }

}