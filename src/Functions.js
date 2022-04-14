/* global BigInt */

import { 
    sendTo, 
    BM58Resumen, 
    BMDecto58,
    BMHexto58, 
    BMHexto36,
    Protocol,
    ProgramVersion,
    API_HOST 
} from "./NosoCrypto";


const sha256 = require('js-sha256');

const getOrderHash = (textLine) => {
    let result = sha256(textLine);
    result = BMHexto36(result);
    return `OR${result}`;
}

const getTransferHash = (textLine) => {
    let result = sha256(textLine);
    result = BMHexto58(result);
    let sum = BM58Resumen(result).toString();
    let key = BMDecto58(sum);
    return `tR${result}${key}`;
}

const getPTCEcn = (ordertype) => {
    return `NSL${ordertype} ${Protocol} ${ProgramVersion} ${Math.floor(Date.now()/1000)} `;
}

const submitOrder = async (origin, destination, amount, reference, addresslist, summarylist, lastblock, send_from_all = false) => {
    const orderString = sendTo(origin, destination, amount, reference, addresslist, summarylist, lastblock, send_from_all)
    
    if(orderString === "-1"){
        return "-1";
    }
    
    // Send Order to API
    const response = await fetch(`${API_HOST}/SendOrder`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            orderString: orderString
        })
    });
    const body = await response.json();

    if(response.status !== 200){
      throw Error(body.message);
    }

    return body.orderResult;
}

const formatAmount = (savedPos, newChar, oldValue, value) => {
    // Ignore non number chars but .
    if(newChar !== "." && isNaN(newChar)){
        value = oldValue;
        savedPos -= 1;
    }else{
        if(newChar === '.'){
        if(oldValue.includes(".")){
            if(savedPos-1 < oldValue.indexOf(".")){
            // New dot is before existing dot
            let first = value.substring(0,savedPos);
            let second = value.substring(savedPos).replace(".","");
            value = first+second;
            if(value[0] === '.') value = "0"+value;            
            savedPos = value.indexOf(".")+1;
            }else{
            // New dot is after existing dot
            let first = oldValue.substring(0,savedPos-1).replace(".","");
            let second = value.substring(savedPos-1);
            value = first+second;
            value = value.replace("..",".");
            savedPos = value.indexOf(".")+1;  
            }
        }
        }

        // Replace first 0
        if(newChar !== "." && BigInt(String(oldValue).replace('.','')) < 100000000 && savedPos === 1){
            value = value.substring(0,1)+value.substring(2);
        }

        // Leading 0
        if(value[0] === "."){
        value = "0"+value;
        }

        // Cases with decimal/dot > . <
        if(value.includes(".")){
        let dotpos = value.indexOf(".");
        
        /* Filling Zeroes */
        let zeroes = value.substring(dotpos+1);
        while(zeroes.length < 8) zeroes += "0";
        
        /* Too much decimals case */
        if(zeroes.length > 8) zeroes = zeroes.substring(0,8);

        value = value.substring(0,dotpos+1)+zeroes;
        }
    }

    return {
        finalValue: value,
        finalPos: savedPos
    }
}

export {
    submitOrder,
    getOrderHash,
    getTransferHash,
    getPTCEcn,

    formatAmount
};