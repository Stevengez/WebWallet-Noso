/* global BigInt */

export default class Wallet {

    constructor(address, custom, balance, incoming = 0n, outgoing = 0n){
        this.address = address;
        this.custom = custom;
        this.balance = balance;
        this.incoming = incoming;
        this.outgoing = outgoing;
        this.publickey = "";
        this.privatekey = "";
    }
    
    get Address(){
        return this.address;
    }

    get Custom(){
        return this.custom;
    }

    get Balance(){
        return this.balance;
    }

    get Incoming(){
        return this.incoming;
    }

    get Outgoing(){
        return this.outgoing;
    }

    set Balance(value){
        this.balance = BigInt(value);
    }

    set Incoming(value){
        this.incoming = BigInt(value);
    }

    set Outgoing(value){
        this.outgoing = BigInt(value);
    }
}