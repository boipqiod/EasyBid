const youtubeService = require("../service/YoutubeService");
const sseManager = require("./SSEManager");
const {delay} = require("../common/common");

class BidDataController {


    //상품 인덱스
    index
    //상품 이름
    productName
    //상품 총 갯수
    productAmount
    //상품 가격
    price
    //현재 판매 수
    saleAmount = 0
    //구매자 정보, 이름, 갯수
    client = []

    maxAmount

    isEnd

    setData = (data) => {

        this.isEnd = false
        this.index = data.index
        this.productName = data.name
        this.price = parseInt(data.price)
        this.productAmount = parseInt(data.amount)
        this.maxAmount = parseInt(data.maxAmount)
        this.client = []
        this.saleAmount = 0
        const message = `${this.productName} 경매를 시작합니다. 상품을 구매하고 싶은 만큼 숫자로 입력해주세요.`
        youtubeService.sendMessage(message).then()

        sseManager.pushAll({
            isEnd: false,
            index: this.index,
            productName: this.productName,
            price: this.price,
            saleAmount: this.saleAmount,
            productAmount: this.productAmount,
            client: this.client
        })

    }

    startFetching = async () => {
        youtubeService.resetPageToken()
        await youtubeService.getChat()
        await this.#fetch()
    }

    #fetch = async () => {
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

            if (this.saleAmount + amount > this.productAmount) {
                amount = this.productAmount - this.saleAmount
                await youtubeService.sendMessage(`${name}님 최대 갯수 초과로 ${amount}개만 구매 확인되었습니다`)
            }else if(this.maxAmount !== 0 && amount > this.maxAmount){
                amount = this.maxAmount
                await youtubeService.sendMessage(`${name}님 최대 갯수 초과로 ${this.maxAmount}개만 구매 확인되었습니다`)
            }else {
                await youtubeService.sendMessage(`${name}님 ${amount}개 확인되었습니다.`)
            }

            //판매한량 저장
            this.saleAmount += amount

            //합치기
            let isBreak = false
            for(let i = 0; i < this.client.length; i ++ ){
                if(this.client[i].name === name){
                    this.client[i].amount += amount
                    isBreak = true
                    break
                }
            }

            if(!isBreak){
                //구매한 사람 저장
                this.client.push({
                    name: name,
                    amount: amount
                })
            }

            //판매 완료 확인
            if (this.saleAmount === this.productAmount) {
                sseManager.pushAll({
                    isEnd: true,
                    index: this.index,
                    productName: this.productName,
                    price: this.price,
                    productAmount: this.productAmount,
                    client: this.client
                })

                this.stopFetching()
                await this.sendEndMessage()
                return
            }else{
                sseManager.pushAll({
                    isEnd: false,
                    index: this.index,
                    productName: this.productName,
                    price: this.price,
                    saleAmount: this.saleAmount,
                    productAmount: this.productAmount,
                    client: this.client
                })
            }
        }

        await delay(500)
        await this.#fetch()
    }

    stopFetching = () => {
        this.sendEndMessage().then()
        this.isEnd = true
    }

    sendEndMessage = async () => {
        if(this.isEnd) return
        const message = `####${this.productName} 판매가 종료되었습니다. 구매하신분들은 확인해주세요. `

        await youtubeService.sendMessage(message)

        let clientMessage = ``

        for(let item of this.client){

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

const bidDataController = new BidDataController()

module.exports = bidDataController