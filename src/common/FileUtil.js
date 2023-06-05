const fs = require('fs')

class FileUtil{

    static saveData = (name, data)=>{
        try {
            if(typeof data === 'object') data = JSON.stringify(data)
            fs.writeFileSync(name, data)
        }catch (e){
            console.log(e)
        }

    }

    static getData = (name) =>{

        try {
            return JSON.parse(fs.readFileSync(`${name}`).toString())
        }catch (e){
            console.log(e)
        }

    }

}

module.exports = {FileUtil}