class OnSaleData {

    name
    price
    amount
    maxAmount
    saleAmount
    //0: 판매 전, 1: 판매 중, 2: 판매 완료
    /**@type number*/
    status
    /**@type {[{name: string, amount: number}]}*/
    clients

    constructor({
                    name,
                    price,
                    amount,
                    maxAmount
                }) {

        this.name = name
        this.price = price
        this.amount = amount
        this.maxAmount = maxAmount
        this.saleAmount = 0
        this.status = 0
        this.clients = []

    }
}

module.exports = OnSaleData