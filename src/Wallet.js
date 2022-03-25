export default class {

    constructor(address, custom, balance, incoming = 0, outgoing = 0){
        this.address = address;
        this.custom = custom;
        this.balance = balance;
        this.incoming = incoming;
        this.outgoing = outgoing;
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
}