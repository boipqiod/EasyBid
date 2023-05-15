import SSE from "../common/sse.js";

let tbody
let inputName
let inputPrice
let inputAmount
let buttonAdd
let saleOff
let saleOn

let spanSaleName
let spanSaleAmount

let buttonBidEnd

let productIndex = 0

/**
 * @type {[{amount: number, saleAmount: number, price: number, name: string, status: number, clients: [{name: string, amount: number}]}]}
 */
let items = []

let isOnSale = false
let saleIndex = -1

window.onload = () =>{
    tbody = document.getElementById("tbody")
    buttonAdd = document.getElementById("button-product-add")
    inputName = document.getElementById("input-product-name")
    inputPrice= document.getElementById("input-product-price")
    inputAmount = document.getElementById("input-product-amount")
    saleOff = document.getElementById("div-sale-off")
    saleOn = document.getElementById("div-sale-on")

    spanSaleName = document.getElementById("span-sale-name")
    spanSaleAmount = document.getElementById("span-sale-amount")

    buttonBidEnd = document.getElementById("button-bid-end")

    addSavedProduct()
    addEvent()
    SSE.initSSE(receivedSSE)
}

const addEvent = () =>{
    buttonAdd.addEventListener("click", addProduct)

    const btnClick = e => { if(e.key === "Enter") buttonAdd.click() }
    inputName.addEventListener('keydown', btnClick)
    inputPrice.addEventListener('keydown', btnClick)
    inputAmount.addEventListener('keydown', btnClick)

    document.getElementById("button-clear").addEventListener("click", ()=>{
        localStorage.clear()
        location.reload()
    })

    buttonBidEnd.addEventListener('click', bidEnd)
}

const addSavedProduct = () =>{
    items = getItems()
    tbody.innerHTML = ""
    productIndex = items.length
    let index = 0
    for(const item of items){
        appendProduct(index, item.name, item.price, item.amount, item.status)
        if(item.status === 1) {
            saleIndex = index
            isOnSale = true
        }
        index += 1
    }
}

const addProduct = async () =>{
    const name = inputName.value
    const price = inputPrice.value
    const amount = inputAmount.value

    if(!name || name === ""){
        swal("상품 이름을 입력해주세요.")
        return
    }else if(!price || price === ""){
        swal("가격을 입력해주세요.")
        return
    }else if(!amount || amount === ""){
        swal("갯수를 입력해주세요.")
        return
    }

    appendProduct(productIndex, name, price, amount, 0)

    items.push({
        name,
        price,
        amount,
        saleAmount: 0,
        status: 0,
        clients: []
    })
    productIndex = items.length
    saveItems(items)
}

/**
 *
 * @param index
 * @param name
 * @param price
 * @param amount
 * @param status
 */
const appendProduct = (index, name, price, amount, status) => {
    const tr = document.createElement("tr")

    price = formatCurrency(price)

    tr.id = `tr-${index}`

    tr.innerHTML =
        `                        
<td class="col-1">${index}</td>
<td class="col-3">${name}</td>
<td class="col-3">${price}</td>
<td class="col-2">${amount}</td>
<td>
    <button ${status === 0 ? "" : "hidden"} id="button-start-${index}" name="${index}" class="start">시작</button>
    <button ${status === 1 ? "" : "hidden"} id="button-end-${index}" class="end">종료</button>
    <button ${status === 2 ? "" : "hidden"} disabled id="button-completed-${index}" class="completed">완료</button>
</td>
<td>
    <button id="button-delete-${index}" class="delete">삭제</button>
</td>
`

    tbody.append(tr)

    document.getElementById(`button-start-${index}`).onclick = () => {
        start(index).then()
    }
    document.getElementById(`button-end-${index}`).onclick = () => {
        end(index).then()
    }
    document.getElementById(`button-delete-${index}`).onclick = () => {
        deleteProduct(index).then()
    }
}

const start = async (index) =>{
    if(isOnSale){
        swal("이미 진행 중인 경매가 있습니다.\n경매 종료 후 진행해 주세요.")
        return
    }

    const item = items[index]

    const bool = await swal("시작", `[${item.name}] 상품 경매를 시작합니다.`, { buttons: true })
    if(!bool) return

    saleIndex = index
    isOnSale = true

    const start = document.getElementById(`button-start-${index}`)
    const end = document.getElementById(`button-end-${index}`)
    start.setAttribute("hidden", "hidden")
    end.removeAttribute("hidden")

    saleOff.style.display = "none"
    saleOn.style.display = "flex"

    saleProductUpdate(index)

    items[index].status = 1
    saveItems()
    await startToServer(index)
}

const end = async (index) =>{
    if(saleIndex !== index){
        swal("현재 경매 중인 상품이 아닙니다.")
        return
    }

    const item = items[index]

    const bool = await swal("종료", `[${item.name}] 상품 경매를 종료합니다.`, { buttons: true })
    if(!bool) return

    endProduct(index)
}

const endProduct = (index) =>{
    const item = items[index]

    swal("종료", `[${item.name}] 상품 경매가 종료되었습니다.`)

    const completed = document.getElementById(`button-completed-${index}`)
    const end = document.getElementById(`button-end-${index}`)
    end.setAttribute("hidden", "hidden")
    completed.removeAttribute("hidden")

    spanSaleName.textContent = spanSaleName.textContent + " (종료)"

    items[index].status = 2
    saveItems()
    isOnSale = false
    saleIndex = -1
    endToServer().then()
}

const deleteProduct = async (index) =>{
    if(saleIndex === index){
        swal("현재 경매 중인 상품을 삭제가 불가능합니다.")
        return
    }
    const item = items[index]

    if(item.status === 2) {
        const bool = await swal("삭제", `[${item.name}] 상품은 경매가 완료된 상품입니다. \n 정말로 삭제하시겠습니까?`, { buttons: true })
        if(!bool) return
    }else{
        const bool = await swal("삭제", `[${item.name}] 상품을 정말로 삭제하시겠습니까?`, { buttons: true })
        if(!bool) return
    }

    items.splice(index, 1);
    saveItems()
    productIndex = items.length - 1
    addSavedProduct()
}

const formatCurrency = value=> {
    const formatter = new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
    });

    return formatter.format(value);
}

const getItems = () =>{
    const items = localStorage.getItem("bidItems")
    if(items === null) return []
    try {
        return JSON.parse(items)
    }catch (e) {
        return []
    }
}

const saveItems = () =>{
    console.log("saveItems", items)
    localStorage.setItem("bidItems", JSON.stringify(items))
}

const receivedSSE = e => {
    let receivedData
    try {
        receivedData = JSON.parse(e.data)
        console.log(receivedData)

        if(receivedData === {}) return

        if(receivedData.isEnd === true){
            endProduct(receivedData.index)
        }else{
            items[receivedData.index].saleAmount = receivedData.saleAmount
            items[receivedData.index].clients = receivedData.client

            saveItems()

            saleProductUpdate(receivedData.index, receivedData.saleAmount)
        }

    } catch (e) {
        console.log(e)
    }
}

const saleProductUpdate = (index, saleAmount=0) =>{
    const item = items[index]

    saleOff.style.display = "none"
    saleOn.style.display = "flex"

    spanSaleName.textContent = item.name
    spanSaleAmount.textContent = saleAmount.toString()
}

const startToServer = async index =>{
    const item = items[index]
    const myHeaders = { 'Content-Type': 'application/json', }
    item.index = index

    const myInit  = {method: "post", body: JSON.stringify(item), headers: myHeaders};

    try {
        const res = await fetch("/startSale", myInit)
        console.log(await res.json())
    }catch (e) {

    }
}

const endToServer = async () =>{
    const myHeaders = { 'Content-Type': 'application/json', }

    const myInit  = {method: "post", headers: myHeaders};

    try {
        const res = await fetch("/endSale", myInit)
        console.log(await res.json())
    }catch (e) {

    }
}

const bidEnd = async () =>{
    const bool = await swal("경매를 종료합니다. \n저장된 경매 내용이 초기화되며, 경매 데이터를 엑셀로 다운받습니다.", {buttons: true})
    if(!bool) return

    const itemList = items

    exportToExcel(itemList)

}

function exportToExcel(data) {
    let ws_data = [];
    data.forEach(item => {
        item.clients.forEach(client => {
            ws_data.push([item.name, item.price, item.amount, item.saleAmount, item.status, client.name, client.amount]);
        });
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Create a new Workbook
    const wb = XLSX.utils.book_new();

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Export the workbook to a file
    XLSX.writeFile(wb, "output.xlsx");
}