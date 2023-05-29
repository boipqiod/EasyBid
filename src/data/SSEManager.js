class SSEManager{

    /**
     * @type {[Response]}
     */
    #resList = []

    constructor() {
        setInterval(()=>{
            this.pushAll(sseType.session, {})
        }, 50 * 1000)

    }

    add = res =>{
        this.#resList.push(res)
    }

    push = (index, type, data) =>{
        this.#resList[index].write(`data: ${JSON.stringify({type, data})}\n\n`)
    }

    pushAll = (type, data) =>{
        for(const res of this.#resList){
            res.write(`data: ${JSON.stringify({type, data})}\n\n`)
        }
    }

    remove = (index) =>{
        this.#resList.slice(index, 1)
    }

    lastIndex = () =>{
        return this.#resList.length - 1
    }
}

const sseManager = new SSEManager()
const sseType = {
    session: "session",
    message: "message",
    startSale: "startSale",
    endSale: "endSale",
    sale: "sale",
    saleClient: "saleClient",
    reset: "reset"
}


module.exports = {sseManager, sseType}