export default class Util{
    static isNumericString = str => {
        return /^\d+$/.test(str);
    }
    static setDelay = time =>{
        return new Promise(resolve => {
            setTimeout(()=>{resolve()},time)
        })
    }
}