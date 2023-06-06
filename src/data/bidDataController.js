const youtubeService = require("../service/YoutubeService");
const {sseManager, sseType} = require("./SSEManager");
const {delay} = require("../common/common");
const {FileUtil} = require("../common/FileUtil");

class BidDataController {


    //상품 인덱스
    index

    /** @type{OnSaleData[]}*/
    onSaleDataList = []

    fileName
    isEnd


    addOnSale = (fileName, onSaleData) =>{
        if(!this.onSaleDataList) this.onSaleDataList = []

        this.onSaleDataList.push(onSaleData)
        this.fileName = fileName
        FileUtil.saveData(fileName, this.onSaleDataList)
    }

    reloadData = (fileName) =>{
        this.fileName = fileName
        this.onSaleDataList = FileUtil.getData(fileName)
        for(let i = 0; i < this.onSaleDataList.length; i++){
            if(this.onSaleDataList[i].status === 1) this.index = i
        }
        this.isEnd = false

        return this.onSaleDataList
    }

    getOnSaleList = () =>{
        return this.onSaleDataList
    }

    getOnSale = () =>{
        return this.onSaleDataList[this.index]
    }

    remove = (index) =>{
        this.onSaleDataList.splice(index, 1);
        FileUtil.saveData(this.fileName, this.onSaleDataList)
    }

    clear = () =>{
        this.onSaleDataList = []
        FileUtil.saveData(this.fileName, this.onSaleDataList)
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
            FileUtil.saveData(this.fileName, this.onSaleDataList)
            const message = `"${onSaleData.name}(${formatCurrency(onSaleData.price)})" 상품의 판매를 시작합니다. 상품을 구매하고 싶은 만큼 숫자로 입력해주세요.`
            youtubeService.sendMessage(message).then()
            sseManager.pushAll(sseType.startSale, {index: this.index, onSaleData: onSaleData})
            youtubeService.resetPageToken()
            await youtubeService.getChat()
        }catch (e) {
            console.log(e)
        }
    }

    fetch = async () => {
        if(this.isEnd) return


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

            await this.saleItem(name, amount)
        }
    }

    saleItem = async (index, name, amount) =>{
        if(typeof amount === 'string') amount = parseInt(amount)
        const onSaleData = this.onSaleDataList[index ? index : this.index]

        if (onSaleData.saleAmount + amount > onSaleData.amount) {
            amount = onSaleData.amount - onSaleData.saleAmount
            if(!index) sseManager.pushAll(sseType.saleClient, {text: `${name}님 ${amount}개*`, onSaleData})

        }else if(onSaleData.maxAmount !== 0 && amount > onSaleData.maxAmount){
            amount = onSaleData.maxAmount
            if(!index) sseManager.pushAll(sseType.saleClient, {text: `${name}님 ${amount}개*`, onSaleData})

        }else {
            if(!index) sseManager.pushAll(sseType.saleClient, {text: `${name}님 ${amount}개`, onSaleData})

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

        console.log('saleItem', name, amount)

        //판매 완료 확인
        if (onSaleData.saleAmount === onSaleData.amount) {
            onSaleData.status = 2
            if(!index) sseManager.pushAll(sseType.endSale, {index: this.index, onSaleData: onSaleData})
            this.stopFetching()
            await this.sendEndMessage(onSaleData)
        }else{
            if(!index) sseManager.pushAll(sseType.sale, {index: this.index, onSaleData: onSaleData})
        }

        FileUtil.saveData(this.fileName, this.onSaleDataList)
    }

    stopFetching = () => {
        this.onSaleDataList[this.index].status = 2
        FileUtil.saveData(this.fileName, this.onSaleDataList)
        sseManager.pushAll(sseType.endSale, {index: this.index, onSaleData: this.onSaleDataList[this.index]})
        this.sendEndMessage(this.onSaleDataList[this.index]).then()
        this.fetch().then()
        this.isEnd = true
    }

    /**
     * @param {OnSaleData} onSaleData
     * @return {Promise<void>}
     */
    sendEndMessage = async (onSaleData) => {
        if(this.isEnd) return
        const message = `"${onSaleData.name}" 상품 판매가 종료되었습니다. 구매하신분들은 확인해주세요.`
        await youtubeService.sendMessage(message)
        // let clientMessage = ``
        // for(let item of onSaleData.clients){
        //     let msg = `[${item.name} 님 : ${item.amount}개] `
        //     if( (clientMessage + msg).length >= 200) {
        //         await youtubeService.sendMessage(clientMessage)
        //         clientMessage = ``
        //     }
        //     clientMessage += msg
        // }
        // await youtubeService.sendMessage(clientMessage)
    }

}

const isNumericString = str=> {
    return /^\d+$/.test(str);
}

const formatCurrency = value=> {
    const formatter = new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
    });

    return formatter.format(value);
}


let bidDataController = new BidDataController()

const clearBid = () =>{
    bidDataController.clear()
}

module.exports = {bidDataController, clearBid}