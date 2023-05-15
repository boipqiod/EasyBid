class SSEManager{

    /**
     * @type {[Response]}
     */
    #resList = []

    add = res =>{
        this.#resList.push(res)
    }

    push = (index, data) =>{
        this.#resList[index].write(`data: ${JSON.stringify(data)}\n\n`)
    }

    pushAll = data =>{
        for(const res of this.#resList){
            res.write(`data: ${JSON.stringify(data)}\n\n`)
        }
    }
}

const sseManager = new SSEManager()

module.exports = sseManager