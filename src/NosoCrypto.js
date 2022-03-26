import BigInt from 'big-integer';
import DivResult from './DivResult';
import {Buffer} from 'buffer';
import Wallet from './Wallet';

// Crypto Libs
const ripemd160 = require('ripemd160-js');
const elliptic = require('elliptic');
//const sha1 = require('js-sha1');
const sha256 = require('js-sha256').sha256;
const ec = new elliptic.ec('secp256k1');

const B58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
//const CoinSimbol = "NOSO"              // Coin 3 chars
//const CoinName = "Noso"                // Coin name
const CoinChar = "N"                   // Char for addresses


const createNewAddress = async() => {
    let keypair = ec.genKeyPair();
    let privateKeyHex = keypair.getPrivate("hex");
    let publicKeyHex = keypair.getPublic().encode("hex");

    let privateKey = Buffer.from(privateKeyHex, 'hex').toString('base64');
    let publicKey = Buffer.from(publicKeyHex, 'hex').toString('base64');

    const publicAddress = await getAddressFromPublicKey(publicKey);
    let newWallet = new Wallet(publicAddress,"",0,0,0);
    newWallet.publickey = publicKey;
    newWallet.privatekey = privateKey;
    return newWallet;
}

const getAddressFromPublicKey = async (pubkey) => {
    let PubSHAHashed = sha256(pubkey).toUpperCase();
    let Hash1 = await ripemd160(PubSHAHashed);
        Hash1 = BMHexto58(Hash1);
    let summ = BM58Resumen(Hash1);
    let key = BMDecto58(String(summ));
    let Hash2 = Hash1+key
    return CoinChar+Hash2;
}

const isValid58 = (base58Text) => {
    for(let c=0;c<base58Text.length;c++){
        if(B58Alphabet.indexOf(base58Text[c]) === -1){
            return false;
        }
    }
    return true;
}

const isValidAddress = (address) => {
    if(address[0] == 'N' && address.length > 20){
        let OrigHash = address.substring(1,address.length-2);
        if(isValid58(OrigHash)){
            let clave = BMDecto58(BM58Resumen(OrigHash));
            OrigHash = CoinChar + OrigHash + clave;
            if(OrigHash === address) return true;
        }
    }
    return false
}

/** Number conversions */

const BMDividir = (numberA, divisor) => {
    let quotient = "";
    let step = "";

    for(let i=0;i<numberA.length;i++){
        step += numberA[i];
        if(parseInt(step) >= parseInt(divisor)){
            quotient += String(parseInt(parseInt(step)/parseInt(divisor)));
            step = String(parseInt(parseInt(step)%parseInt(divisor)));
        }else{
            quotient += "0";
        }
    }
    let r = new DivResult(BigInt(quotient).toString(), BigInt(step).toString());
    return r;
}

const BMHexto58 = (numberhex) => {
    let resultDiv;
    let difference;
    let result = "";

    let decimalValue = BMHexToDec(numberhex);

    while (decimalValue.length >= 2){
        resultDiv = BMDividir(decimalValue, 58)
        decimalValue = resultDiv.quotient;
        difference = resultDiv.difference;
        result = B58Alphabet[parseInt(difference)] + result;
    }

    if(parseInt(decimalValue) >= 58){
        resultDiv = BMDividir(decimalValue, 58)
        decimalValue = resultDiv.quotient;
        difference = resultDiv.difference;
        result = B58Alphabet[parseInt(difference)] + result;
    }

    if(parseInt(decimalValue) > 0){
        result = B58Alphabet[parseInt(decimalValue)] + result;
    }

    return result;
}

const BMHexToDec = (numerohex) => {
    return BigInt(numerohex, 16).toString();
}

const BMDecto58 = (number) => {
    let resultDiv;
    let difference;
    let result = "";
    let decimalValue = String(number);

    while(decimalValue.length >= 2){
        resultDiv = BMDividir(decimalValue, 58);
        decimalValue = resultDiv.quotient;
        difference = resultDiv.difference;
        result = B58Alphabet[parseInt(difference)] + result;
    }

    if(parseInt(decimalValue) >= 58){
        resultDiv = BMDividir(decimalValue, 58);
        decimalValue = resultDiv.quotient;
        difference = resultDiv.difference;
        result = B58Alphabet[parseInt(difference)] + result;
    }

    if(parseInt(decimalValue) > 0){
        result = B58Alphabet[parseInt(decimalValue)] + result;
    }
    
    return result;
}

const BM58Resumen = (number58) => {
    let total = 0;
    for(let i =0;i<number58.length;i++){
        total += B58Alphabet.indexOf(number58[i]);
    }
    return total;
}

export {
    isValidAddress,
    isValid58,
    BMDecto58,
    BMDividir,
    BM58Resumen,
    createNewAddress
}