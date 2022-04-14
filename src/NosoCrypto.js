/* global BigInt */

import DivResult from './DivResult';
import { Buffer } from 'buffer';
import Wallet from './Wallet';
import OrderData from './OrderData';
import { KJUR } from 'jsrsasign';
import { getTransferHash, getOrderHash, getPTCEcn } from './Functions';

// API for wallet sync and order requests
const API_HOST = process.env.REACT_APP_API_HOST;

// Crypto Libs
const ripemd160 = require('ripemd160-js');
const elliptic = require('elliptic');
const sha256 = require('js-sha256').sha256;
const ec = new elliptic.ec('secp256k1');

const Comisiontrfr      = 10000n        // Amount/Comisiontrfr = 0.01% of the amount
const MinimunFee        = 10n           // Minimun fee for transfer

const B58Alphabet       = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B36Alphabet       = "0123456789abcdefghijklmnopqrstuvwxyz";
const B64Alphabet       = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const Protocol          = 1;
const ProgramVersion    = "1.0";
//const CoinSimbol = "NOSO"              // Coin 3 chars
//const CoinName = "Noso"                // Coin name
const CoinChar = "N";                   // Char for addresses

const createNewAddress = async() => {
    let keypair = ec.genKeyPair();
    let privateKeyHex = keypair.getPrivate("hex");
    let publicKeyHex = keypair.getPublic().encode("hex");

    let privateKey = Buffer.from(privateKeyHex, 'hex').toString('base64');
    let publicKey = Buffer.from(publicKeyHex, 'hex').toString('base64');

    const publicAddress = await getAddressFromPublicKey(publicKey);
    let newWallet = new Wallet(publicAddress,"",0n,0n,0n);
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
    if(address[0] === 'N' && address.length > 20){
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

const BMHexto36 = (numberhex) => {
    let resultDiv;
    let difference;
    let result = "";

    let decimalValue = BMHexToDec(numberhex);

    while (decimalValue.length >= 2){
        resultDiv = BMDividir(decimalValue, 36)
        decimalValue = resultDiv.quotient;
        difference = resultDiv.difference;
        result = B36Alphabet[parseInt(difference)] + result;
    }

    if(parseInt(decimalValue) >= 36){
        resultDiv = BMDividir(decimalValue, 36)
        decimalValue = resultDiv.quotient;
        difference = resultDiv.difference;
        result = B36Alphabet[parseInt(difference)] + result;
    }

    if(parseInt(decimalValue) > 0){
        result = B36Alphabet[parseInt(decimalValue)] + result;
    }

    return result;
}

const BMHexToDec = (numerohex) => {
    return BigInt('0x'+numerohex).toString(10);
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

const int2bin = (number) => {
    return (number >>> 0).toString(2);
}

const CustomBase64Decoder = (message) => {
    let indexList = [];

    for(let c of message){
        indexList.push(B64Alphabet.indexOf(c));
    }

    let binaryString = "";

    for(let i of indexList){
        let binary = int2bin(i);
        while(binary.length < 6){
            binary = "0"+binary;
        }
        binaryString += binary;
    }

    let strAux = binaryString;
    let tempByteArray = [];

    while(strAux.length >= 8){
        let currentGroup = strAux.substring(0,8);
        let intVal = parseInt(currentGroup, 2);
        if(intVal > 63){
            tempByteArray.push(intVal);
            strAux = strAux.substring(8);
        }else{
            tempByteArray.push(intVal);
            strAux = strAux.substring(8);
        }
    }

    return Buffer.from(tempByteArray, "ascii");
}

const getStringSigned = (message, privatekey) => {
    // Create Signer
    let signer = new KJUR.crypto.Signature({"alg":"SHA1withECDSA"});
    
    signer.init(
        {
            d: Buffer.from(privatekey,"base64").toString("hex"), // Key is passed in Hex, decoded from base64
            curve: "secp256k1" // Curve used for noso signing
        }
    );

    // Decode the message from Base64 and encode it to Hex
    let messageHex = CustomBase64Decoder(message).toString("hex");
    // Set the value for the digest
    signer.updateHex(messageHex);

    // Generate the signature
    let signature = signer.sign();

    return Buffer.from(signature,"hex").toString("base64");
}

const getFee = (amount) => {
    const result = BigInt(amount)/Comisiontrfr;
    if(result<MinimunFee){
        return MinimunFee;
    }
    return result;
}

const getSummaryBalance = (address, summarylist) => {
    let balance = 0;
    summarylist.forEach((wallet) => {
        if(wallet.address === address){
            balance = wallet.balance.toString();
            return;
        }
    });

    return balance;
}

const getPendingBalance = (address, addresslist) => {
    let balance = 0;
    addresslist.forEach((wallet) => {
        if(wallet.address === address){
            balance = wallet.outgoing.toString();
            return;
        }
    });

    return balance;
}

const updateInOutBalance = (addresslist, o_wallet, i_wallet, outgoing, incoming) => {
    // Update values for outgoing/incoming in address list for instant update in GUI
    addresslist.forEach((w) => {
        if(w.address === o_wallet.address){
            w.outgoing += outgoing;
            return;
        }

        if(w.address === i_wallet){
            w.incoming += incoming;
            return;
        }
    });
}

const sendFundsFromAddress = (
    origin,
    destination,
    amount,
    fee,
    reference,
    ordertime,
    line,
    lastblock,
    wallet
) => {
    let feeTrFr = 0n;
    let amountTrFr = 0n;
    let orderInfo = new OrderData();
    let available = BigInt(wallet.balance-wallet.outgoing);

    if(available > BigInt(fee)){
        feeTrFr = BigInt(fee);
    }else{
        feeTrFr = available;
    }

    if(available > (amount+fee)){
        amountTrFr = BigInt(amount);
    }else{
        amountTrFr = BigInt(available-fee);
    }

    if(amountTrFr < 0){
        amountTrFr = 0;
    }

    orderInfo.orderID = "";
    orderInfo.orderLines = 1;
    orderInfo.orderType = "TRFR";
    orderInfo.timeStamp = ordertime;
    orderInfo.reference = reference;
    orderInfo.trxLine = line
    orderInfo.sender = wallet.publickey;
    orderInfo.address = wallet.address;
    orderInfo.receiver = destination;
    orderInfo.amountFee = feeTrFr;
    orderInfo.amountTrFr = amountTrFr;
    orderInfo.signature = getStringSigned(
        (ordertime+
        origin+
        destination+
        amountTrFr.toString()+
        feeTrFr.toString()+
        String(line)),
        wallet.privatekey
    );

    orderInfo.trfrID = getTransferHash(
        ordertime+
        origin+
        destination+
        amount+
        lastblock
    );
    return orderInfo;
}

const sendTo = (origin, destination, amount, reference, addresslist, summarylist, lastblock, send_from_all = false) => {
    let currentTime = Math.floor(Date.now()/1000);
    let available = getSummaryBalance(origin, summarylist) - getPendingBalance(origin, addresslist);
    let pendingfee = getFee(amount);
    let pendingAmount = BigInt(amount);

    if(pendingAmount+pendingfee <= available || send_from_all){
        let arrayTrFrs = [];
        let trxLine = 0;
        let orderHashString = currentTime.toString();
        
        // Place Origin Wallet on top of the list
        let orderedList = JSON.parse(JSON.stringify(addresslist, (_, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

        let wallobj = orderedList.find(wallet => wallet.address === origin);
        let index = orderedList.indexOf(wallobj);
        orderedList.splice(index,1);
        orderedList.unshift(wallobj);

        // Transfer Count (number of transactions to accomplish the whole order)
        let counter = 0;
        while(pendingAmount > 0){
            if((orderedList[counter].balance-getPendingBalance(orderedList[counter].address,addresslist)) > 0){
                trxLine++;
                let order = sendFundsFromAddress(
                    orderedList[counter].address,
                    destination,
                    pendingAmount,
                    pendingfee,
                    reference,
                    currentTime,
                    trxLine,
                    lastblock,
                    orderedList[counter]
                );

                arrayTrFrs.push(order)
                pendingfee -= order.amountFee;
                pendingAmount -= order.amountTrFr;
                orderHashString += order.trfrID;

                updateInOutBalance(addresslist, orderedList[counter], destination, order.amountTrFr+order.amountFee, order.amountTrFr);
            }
            counter++;
        }

        for(let tr of arrayTrFrs){
            tr.orderID = getOrderHash(trxLine+orderHashString);
            tr.orderLines = trxLine;
        }

        let orderString = getPTCEcn("ORDER")+"ORDER "+trxLine+" $";

        for(let tr of arrayTrFrs){
            orderString += tr.getString()+" $";
        }

        return orderString.substring(0, orderString.length-2);
    }else{
        console.log("Address with not enough funds, available: ",available);
        console.log("Required: ",pendingAmount+pendingfee);
        return "-1";
    }
}

export {
    BMHexto58,
    BMHexto36,
    BMDecto58,
    BM58Resumen,
    createNewAddress,
    sendTo,
    getFee,

    Protocol,
    ProgramVersion,
    API_HOST
}