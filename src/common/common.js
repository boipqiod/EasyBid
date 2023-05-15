/**
 *
 * @param {number}time
 * @return {Promise<null>}
 */
module.exports.delay = time =>{
    return new Promise(resolve => {
        setTimeout(()=>{resolve()}, time)
    })
}