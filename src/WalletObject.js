export default class WalletObject {
    constructor(
        address,
        balance,
        incoming,
        outgoing
    ){
        this.address = address;
        this.balance = balance;
        this.incoming = incoming;
        this.outgoing = outgoing;
    }

}