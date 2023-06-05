import SSE from "../common/sse.js";

let tbody
let inputName
let inputPrice
let inputAmount
let inputMax
let buttonAdd
let saleOff
let saleOn

let fileName

let spanSaleName
let spanSaleAmount

let buttonSaveExcel
let buttonBidEnd
let buttonRefreshChat

let buttonReload

let productIndex = 0

/**
 * @type {[{amount: number, maxAmount: number, saleAmount: number, price: number, name: string, status: number, clients: [{name: string, amount: number}]}]}
 */
let items = []

let isOnSale = false
let saleIndex = -1

window.onload = async () =>{
    tbody = document.getElementById("tbody")
    buttonAdd = document.getElementById("button-product-add")
    inputName = document.getElementById("input-product-name")
    inputPrice= document.getElementById("input-product-price")
    inputAmount = document.getElementById("input-product-amount")
    inputMax = document.getElementById("input-product-max")
    saleOff = document.getElementById("div-sale-off")
    saleOn = document.getElementById("div-sale-on")

    spanSaleName = document.getElementById("span-sale-name")
    spanSaleAmount = document.getElementById("span-sale-amount")

    buttonBidEnd = document.getElementById("button-bid-end")
    buttonSaveExcel = document.getElementById("button-save-excel")
    buttonRefreshChat = document.getElementById("button-refresh-chat")
    buttonReload = document.getElementById("button_reload")

    fileName = document.getElementById('input_name')

    await reloadData()

    await addSavedProduct()
    addEvent()
    SSE.initSSE(receivedSSE)
}

const addEvent = () =>{
    buttonAdd.addEventListener("click", addProduct)

    const btnClick = e => { if(e.key === "Enter") buttonAdd.click() }
    inputName.addEventListener('keydown', btnClick)
    inputPrice.addEventListener('keydown', btnClick)
    inputAmount.addEventListener('keydown', btnClick)

    buttonBidEnd.addEventListener('click', bidEnd)
    buttonSaveExcel.addEventListener('click', exportToExcel)
    buttonRefreshChat.addEventListener('click', refreshChat)

    buttonReload.addEventListener('click', reloadAction)
}

const reloadAction = async () =>{
    const name = fileName.value
    localStorage.setItem('fileName', name)
    const myHeaders = { 'Content-Type': 'application/json', }
    const myInit  = {method: "post", body: JSON.stringify({name}), headers: myHeaders};
    try {
        const res = await fetch("/data/reload", myInit)
        console.log(await res.json())
        await addSavedProduct()

    }catch (e) {
        console.log(e)
    }
}

const reloadData = async () =>{
    let name = localStorage.getItem('fileName')
    if(!name) {
        name = fileName.value
    }

    fileName.value = name
    const myHeaders = { 'Content-Type': 'application/json', }
    const myInit  = {method: "post", body: JSON.stringify({name}), headers: myHeaders};
    try {
        const res = await fetch("/data/reload", myInit)
        console.log(await res.json())
    }catch (e) {
        console.log(e)
    }
}

const addSavedProduct = async () =>{
    items = await getItems()
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
    const max = inputMax.value

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

    const item = {
        name,
        price: parseInt(price),
        amount: parseInt(amount),
        maxAmount: parseInt(max),
        saleAmount: 0,
        status: 0,
        clients: []
    }

    items.push(item)
    productIndex = items.length
    await saveItem(item)
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
<td class="col-1">${index + 1}</td>
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

    const bool = await swal("시작", `[${item.name}] 상품 판매를 시작합니다.`, { buttons: true })
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
    await startToServer(index)
}

const setStart = (index) =>{
    const start = document.getElementById(`button-start-${index}`)
    const end = document.getElementById(`button-end-${index}`)
    start.setAttribute("hidden", "hidden")
    end.removeAttribute("hidden")

    saleOff.style.display = "none"
    saleOn.style.display = "flex"
}

const end = async (index) =>{
    if(saleIndex !== index){
        swal("현재 경매 중인 상품이 아닙니다.")
        return
    }

    const item = items[index]

    const bool = await swal("종료", `[${item.name}] 상품 판매를 종료합니다.`, { buttons: true })
    if(!bool) return

    endProduct(index)
    endToServer().then()
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
    isOnSale = false
    saleIndex = -1
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

    productIndex = items.length - 1
    await removeToServer(index)
    await addSavedProduct()
}

const removeToServer = async (index) =>{

    const myHeaders = { 'Content-Type': 'application/json' }
    const myInit  = {method: "post", body: JSON.stringify({index}), headers: myHeaders};
    try {
        const res = await fetch("/data/remove", myInit)
        console.log(await res.json())
    }catch (e) {
        console.log(e)
        return []
    }
}

const formatCurrency = value=> {
    const formatter = new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
    });

    return formatter.format(value);
}

const getItems = async () =>{

    const myHeaders = { 'Content-Type': 'application/json' }
    const myInit  = {method: "get", headers: myHeaders};
    try {
        const res = await fetch("/data/getDataList", myInit)

        const data = await res.json()
        console.log("getItems", data)
        return data
    }catch (e) {
        console.log(e)
        return []
    }

}

const saveItems = () =>{
    console.log("saveItems", items)
    localStorage.setItem("bidItems", JSON.stringify(items))
}

const saveItem = async (item) =>{

    localStorage.setItem('fileName', fileName.value)
    const myHeaders = { 'Content-Type': 'application/json' }
    const myInit  = {method: "post", body: JSON.stringify({name: fileName.value, item}), headers: myHeaders};
    try {
        const res = await fetch("/data/addData", myInit)
        console.log(await res.json())
    }catch (e) {
        console.log(e)
    }
}

const receivedSSE = e => {
    let receivedData
    try {
        receivedData = JSON.parse(e.data)
        console.log(receivedData)
        switch (receivedData.type){
            case "session": return;
            case "startSale":{
                const data = receivedData.data
                setStart(data.index)
                return;
            }
            case "endSale":{
                const data = receivedData.data
                endProduct(data.index)
                return;
            }
            case "sale": {
                const data = receivedData.data
                saleProductUpdate(data.index, data.onSaleData.saleAmount)
                return;
            }
            case "reset":{
                location.reload()
                return;
            }
            case "login":{
                window.open("/auth/sign", '_blank')
                swal("로그인 창이 열렸습니다.")
            }
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
    const myHeaders = { 'Content-Type': 'application/json', }
    const myInit  = {method: "post", body: JSON.stringify({index}), headers: myHeaders};
    try {
        const res = await fetch("/startSale", myInit)
        console.log(await res.json())
    }catch (e) {
        console.log(e)
    }
}

const endToServer = async () =>{
    const myHeaders = { 'Content-Type': 'application/json', }
    const myInit  = {method: "post", headers: myHeaders};
    try {
        const res = await fetch("/endSale", myInit)
        console.log(await res.json())
    }catch (e) {
        console.log(e)
    }
}

const bidEnd = async () =>{
    const bool = await swal("경매를 종료합니다. \n저장된 경매 내용이 초기화됩니다.", {buttons: true})
    if(!bool) return

    const myHeaders = { 'Content-Type': 'application/json', }
    const myInit  = {method: "post", headers: myHeaders};
    try {
        const res = await fetch("/endBid", myInit)
        await addSavedProduct()

        console.log(await res.json())
    }catch (e) {
        console.log(e)
    }
}

const refreshChat = async () =>{
    const myHeaders = { 'Content-Type': 'application/json', }
    const myInit  = {method: "post", headers: myHeaders};
    try {
        const res = await fetch("/refresh", myInit)
        console.log(await res.json())
    }catch (e) {
        console.log(e)
    }
}

const exportToExcel = async () => {

    const bool = await swal("현재까지 정보를 엑셀로 저장합니다.", {buttons: true})
    if(!bool) return

    /**@type {[{name: string, data: string[][]}]} */
    const excelData = [ ]

    for (const item of items) {
        for (const client of item.clients) {
            const name = removeSpecialCharacters(client.name)

            const data = excelData.find((value) => value.name === name);

            if (data) {
                data.data.push(["", item.name, client.amount, item.price, client.amount * item.price]);
            } else {

                excelData.push({
                    name: name,
                    data: [["고객명", "상품 이름", "수량", "개당 금액", "금액"], [client.name, item.name, client.amount, item.price, client.amount * item.price]],
                });
            }
        }
    }
    console.log(excelData)

    const workbook = XLSX.utils.book_new();

    for(const data of excelData){
        const worksheet = XLSX.utils.aoa_to_sheet(data.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, data.name);
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const filename = `${year}-${month}-${day}.xlsx`;
    XLSX.writeFile(workbook, filename);
}

function removeSpecialCharacters(str) {
    // 특수 문자 패턴을 정규식으로 표현
    var pattern = /[^\w\s]/g;

    // 정규식에 매치되는 특수 문자 제거 후 반환
    return str.replace(pattern, '');
}
