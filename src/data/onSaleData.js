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
        this.price = typeof price === "string" ? parseInt(price) : price
        this.amount = typeof amount === "string" ? parseInt(amount) : amount
        this.maxAmount = typeof maxAmount === "string" ? parseInt(maxAmount) : maxAmount
        this.saleAmount = 0
        this.status = 0
        this.clients = []

    }
}

module.exports = OnSaleData