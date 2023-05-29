const youtubeService = require("../service/YoutubeService");
const {sseManager, sseType} = require("./SSEManager");
const {delay} = require("../common/common");

class BidDataController {


    //상품 인덱스
    index

    /** @type{OnSaleData[]}*/
    onSaleDataList = []

    isEnd

    /**
     * @param {OnSaleData} onSaleData
     */
    addOnSale = (onSaleData) =>{
        this.onSaleDataList.push(onSaleData)
    }

    getOnSaleList = () =>{
        return this.onSaleDataList
    }

    getOnSale = () =>{
        return this.onSaleDataList[this.index]
    }

    remove = (index) =>{
        this.onSaleDataList.splice(index, 1);
    }

    clear = () =>{
        this.onSaleDataList = []
    }

    /**
     * @param {number} index
     */
    startFetching = async (index) => {
        try {
            this.isEnd = false
            this.index = index
            const onSaleData = this.onSaleDataList[this.index]
            onSaleData.status = 1
            const message = `"${this.index + 1}.${onSaleData.name}" 상품의 판매를 시작합니다. 상품을 구매하고 싶은 만큼 숫자로 입력해주세요.`
            youtubeService.sendMessage(message).then()
            sseManager.pushAll(sseType.startSale, {index: this.index, onSaleData: onSaleData})
            youtubeService.resetPageToken()
            await youtubeService.getChat()
            await this.#fetch()
        }catch (e) {
            console.log(e)
        }

    }

    #fetch = async () => {
        if(this.isEnd) return

        const onSaleData = this.onSaleDataList[this.index]

        const response = await youtubeService.getChat()
        const delayTime = response.pollingIntervalMillis ? response.pollingIntervalMillis :  1000
        const items = response.items

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const name = item.authorDetails.displayName

            const amountString = item.snippet.displayMessage
            if(!isNumericString(amountString)) continue
            let amount = parseInt(amountString)
            if (isNaN(amount)) continue

            console.log(name, amount)

            if (onSaleData.saleAmount + amount > onSaleData.amount) {
                amount = onSaleData.amount - onSaleData.saleAmount
                sseManager.pushAll(sseType.saleClient, {text: `${name}님 최대 갯수 초과로 ${amount}개만 구매 확인되었습니다`, onSaleData})

                // await youtubeService.sendMessage(`${name}님 최대 갯수 초과로 ${amount}개만 구매 확인되었습니다`)
            }else if(onSaleData.maxAmount !== 0 && amount > onSaleData.maxAmount){
                amount = onSaleData.maxAmount
                sseManager.pushAll(sseType.saleClient, {text: `${name}님 최대 갯수 초과로 ${amount}개만 구매 확인되었습니다`, onSaleData})

                // await youtubeService.sendMessage(`${name}님 최대 갯수 초과로 ${amount}개만 구매 확인되었습니다`)
            }else {
                sseManager.pushAll(sseType.saleClient, {text: `${name}님 ${amount}개 확인되었습니다.`, onSaleData})

                // await youtubeService.sendMessage(`${name}님 ${amount}개 확인되었습니다.`)
            }

            //판매한량 저장
            onSaleData.saleAmount += amount

            //합치기
            let isBreak = false
            for(let i = 0; i < onSaleData.clients.length; i ++ ){
                if(onSaleData.clients[i].name === name){
                    onSaleData.clients[i].amount += amount
                    isBreak = true
                    break
                }
            }

            if(!isBreak){
                //구매한 사람 저장
                onSaleData.clients.push({
                    name: name,
                    amount: amount
                })
            }

            //판매 완료 확인
            if (onSaleData.saleAmount === onSaleData.amount) {
                onSaleData.status = 2
                sseManager.pushAll(sseType.endSale, {index: this.index, onSaleData: onSaleData})
                this.stopFetching()
                await this.sendEndMessage(onSaleData)
                return
            }else{
                sseManager.pushAll(sseType.sale, {index: this.index, onSaleData: onSaleData})
            }
        }
        await delay(delayTime)
        await this.#fetch()
    }

    stopFetching = () => {
        this.onSaleDataList[this.index].status = 2
        sseManager.pushAll(sseType.endSale, {index: this.index, onSaleData: this.onSaleDataList[this.index]})
        this.sendEndMessage(this.onSaleDataList[this.index]).then()
        this.isEnd = true
    }

    /**
     * @param {OnSaleData} onSaleData
     * @return {Promise<void>}
     */
    sendEndMessage = async (onSaleData) => {
        if(this.isEnd) return
        const message = `####${onSaleData.name} 판매가 종료되었습니다. 구매하신분들은 확인해주세요. `

        await youtubeService.sendMessage(message)
        let clientMessage = ``
        for(let item of onSaleData.clients){
            let msg = `[${item.name} 님 : ${item.amount}개] `
            if( (clientMessage + msg).length >= 200) {
                await youtubeService.sendMessage(clientMessage)
                clientMessage = ``
            }
            clientMessage += msg
        }
        await youtubeService.sendMessage(clientMessage)
    }

}

const isNumericString = str=> {
    return /^\d+$/.test(str);
}

let bidDataController = new BidDataController()

const clearBid = () =>{
    bidDataController = new BidDataController()
}

module.exports = {bidDataController, clearBid}