
export default class OrderData {
    constructor(){
        this.block = -1;
        this.orderID = "";
        this.orderLines = -1;
        this.orderType = "";
        this.timeStamp = -1;
        this.reference = "";
        this.trxLine = -1;
        this.sender = "";
        this.address = "";
        this.receiver = "";
        this.amountFee = -1;
        this.amountTrFr = -1;
        this.signature = "";
        this.trfrID = "";
    }

    getString() {
        return `${this.orderType} ${this.orderID} ${this.orderLines} ${this.orderType} ${this.timeStamp} ${this.reference} ${this.trxLine} ${this.sender} ${this.address} ${this.receiver} ${this.amountFee} ${this.amountTrFr} ${this.signature} ${this.trfrID}`;
    }
}