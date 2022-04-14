/* global BigInt */
import React, {useRef, useState, useEffect} from 'react';
import { QRCodeSVG } from 'qrcode.react';
//import BigInt from 'big-integer';
import {Buffer} from 'buffer';
import {saveAs} from 'file-saver';
import Wallet from './Wallet';
import JSZip from 'jszip';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Style/style.css';
import PendingInfo from './PendingInfo';
import { createNewAddress, getFee, API_HOST } from './NosoCrypto';
import { submitOrder, formatAmount } from './Functions';

/** Images */
import noso_coin from './Images/noso_coin.png';
import settings from './Images/Settings.svg';
import block_icon from './Images/Block.svg';

import {
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';

const App = () => {
  // Alert Creation Lib
  const alertOptions = {
    position: 'top-right',
    autoClose: 1000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  };

  // Use States
  const [addressList, setAddressList] = useState([]);
  const [addressViewList, setAddressViews] = useState([]);
  const [summaryList, setSummaryList] = useState([]);
  const [pendings, setPendings] = useState("");
  const [balance, changeBalance] = useState(0);
  const [block, changeBlock] = useState(0);
  const [sync, changeSyncStatus] = useState(false);
  const [timestamp, updateTime] = useState(new Date().getTime());
  const [showAlert, toggleAlert] = useState(false);
  const [QRcode, setQRcode] = useState("");
  const [showQR, toggleQR] = useState(false);
  const [showOrderForm, toggleOrderForm] = useState(false);
  const [validAmount, toggleValid] = useState(undefined);
  const [fundsConfirm, toggleConfirm] = useState(false);
  const [fundsOrigin, setOrigin] = useState("");
  const [fundsDestination, setDestination] = useState("");
  const [fundsAmountShow, setAmountShow] = useState("0.00000000");
  const [sendFromAll, toggleSendFromAll] = useState(false);
  const [fundsRef, setReference] = useState("null");
    
  const blockRef = useRef();
        blockRef.current = block;
  const summaryListRef = useRef();
        summaryListRef.current = summaryList;
  const balanceRef = useRef();
        balanceRef.current = balance;
  const pendingsRef = useRef();
        pendingsRef.current = pendings;
  const addressListRef = useRef();
        addressListRef.current = addressList;
  const fundsOriginRef = useRef();
        fundsOriginRef.current = fundsOrigin;
  const fundsDestinationRef = useRef();
        fundsDestinationRef.current = fundsDestination;
  const fundsAmountRef = useRef("000000000");
  const fundsAmountShowRef = useRef();
        fundsAmountShowRef.current = fundsAmountShow 
  const fundsRefRef = useRef();
        fundsRefRef.current = fundsRef; 
  const sendFromAllRef = useRef();
        sendFromAllRef.current = sendFromAll;
  const hiddenFilePicker = useRef(null);

  // Amount Filter Variables 
  let lastInputValue = useRef("0.00000000");
  // ----------------------- 

  useEffect(() => {
    // Apply gray background
    document.body.style.backgroundColor = "#818589";
    
    // Start the timer task
    let timerTask = setInterval(() => {
      updateTime(current => current + 1000);
    }, 1000);

    // Set current addreses
    setAddressArray();

    // Sync wallet
    SyncWallet();
    let syncTask = setInterval(() => {
      SyncWallet();
    }, 10000);

    
    return () => {
      clearInterval(timerTask);
      clearInterval(syncTask);
    }

  }, []);

  const handleImport = () => {
    hiddenFilePicker.current.click();
  }

  const handleFileSelection = (e) => {
    let file = e.target.files[0];
    let fileExt = file.name.split(".");
    let lastExt = fileExt.pop();
    let slastExt = fileExt.pop();
    
    if(lastExt.toUpperCase() === "PKW"){
      parseWallet(file);      
    }else if(lastExt.toUpperCase() === "BAK" && slastExt.toUpperCase() === "PKW"){
      parseWallet(file);
    }else{
      showMessage('Invalid Wallet File (.pkw or .pkw.bak is needed', toast.TYPE.ERROR);
    }
  }

  const showMessage = (message, type) => {
    switch(type){
      case toast.TYPE.WARNING:
        toast.warn(message, alertOptions);
        break;
      case toast.TYPE.ERROR:
        toast.error(message, alertOptions);
        break;
      case toast.TYPE.SUCCESS:
        toast.success(message, alertOptions);
        break;
      case toast.TYPE.INFO:
        toast.info(message, alertOptions);
        break;
      default:
        toast(message, alertOptions);
        break;
    }
  }

  const getNewAddress = () => {
    createNewAddress().then((newWallet) => {
      addressListRef.current.push(newWallet);
      setAddressList(addressListRef.current);
      setAddressArray();
      writeWalletFile();
    });
    toggleAlert(false);
  }

  const writeWalletFile = () => {
    let binaryArray = [];
    const filler = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    
    for(let wallet of addressListRef.current){
      let adress_start = Buffer.from([wallet.address.length]);
      let address = Buffer.from(wallet.address);
      let address_filler = Buffer.from(filler.slice(0,40-wallet.address.length));

      let custom_start = Buffer.from([wallet.custom.length]);
      let custom = Buffer.from(wallet.custom);
      let custom_filler = Buffer.from(filler.slice(0,40-wallet.custom.length));

      let public_start = Buffer.from([wallet.publickey.length]);
      let publickey = Buffer.from(wallet.publickey);
      let public_filler = Buffer.from(filler.slice(0,255-wallet.publickey.length));

      let private_start = Buffer.from([wallet.privatekey.length]);
      let privatekey = Buffer.from(wallet.privatekey);
      let private_filler = Buffer.from(filler.slice(0,255-wallet.privatekey.length));

      let empty_balance = Buffer.from(filler.slice(0,8));
      let empty_pending = Buffer.from(filler.slice(0,8));
      let empty_score = Buffer.from(filler.slice(0,8));
      let empty_lastop = Buffer.from(filler.slice(0,8));

      let walletBlock = Buffer.concat([
        adress_start,
        address,
        address_filler,

        custom_start,
        custom,
        custom_filler,
        
        public_start,
        publickey,
        public_filler,

        private_start,
        privatekey,
        private_filler,

        empty_balance,
        empty_pending,
        empty_score,
        empty_lastop
      ]);
      
      binaryArray.push(walletBlock);
    }
    
    let blob = new Blob(binaryArray);
    saveAs(blob, "web-wallet.pkw");
  };

  const parseWallet = (file) => {
    // FileReader
    var reader = new FileReader();

    // Callback for read complete
    reader.onload = function(e) {
        let summaryBytes = new Int8Array(e.target.result);
        let SummaryList = [];
        while(summaryBytes.length > 0){
          let current = summaryBytes.subarray(0,626);
          let address = new TextDecoder().decode(current.subarray(1, current[0]+1));
          let custom = new TextDecoder().decode(current.subarray(42, 42+current[41]));
          let publickey = new TextDecoder().decode(current.subarray(83, 83+current[82]));
          let privatekey = new TextDecoder().decode(current.subarray(339, 339+current[338]));
          
          const nW = new Wallet(address,custom, 0n,0n,0n);
          nW.publickey = publickey;
          nW.privatekey = privatekey;

          let exists = false;
          addressListRef.current.forEach((value) => {
            if(value.address === address){
              exists = true;
              return;
            }
          });

          if(!exists){
            SummaryList.push(nW);
          }

          summaryBytes = summaryBytes.subarray(626);
        }
        
        addressListRef.current.push(...SummaryList);
        setAddressList(addressListRef.current);
        processPendings();
        recalcBalanceFromSummary();
    };

    // Callback for read error
    reader.onerror = function(e) {
      showMessage('Error: '+e, toast.TYPE.ERROR);
    };
    
    reader.readAsArrayBuffer(file);
  }

  const stringToOrderData = (input) => {
    let tokens = input.split(",");
    
    let pI = new PendingInfo(
      tokens[0],
      tokens[1],
      tokens[2],
      tokens[3],
      tokens[4]
    )
    return pI;
  }

  const SyncWallet = async () => {
    getLatestConsensus().then((result) => {
      if(result.LastBlock > blockRef.current || summaryListRef.current === undefined){
        getSummaryAPI().then(newList => {
          changeBlock(result.LastBlock);
          changeSyncStatus(true);
          if(pendingsRef.current !== result.Pendings){
            setPendings(result.Pendings);
            processPendings();
          }
          setSummaryList(newList);
          recalcBalanceFromSummary();
        });
      }else{
        if(pendingsRef.current !== result.Pendings){
          setPendings(result.Pendings);
          processPendings();
          recalcBalanceFromSummary();
        }
      }
    });
  }

  const processPendings = () => {
    // Reset Pendings to 0
    addressListRef.current.forEach((wallet) => {
      wallet.Incoming = 0;
      wallet.Outgoing = 0;      
    });

    let tokens = pendingsRef.current.split(" ");

    tokens.forEach((token) => {
      if(token !== ""){
        let pendingInfo = stringToOrderData(token);
        if(pendingInfo.TO_Type === "TRFR"){
          
          addressListRef.current.forEach((wallet) => {
            if(wallet.Address === pendingInfo.TO_Sender){
              wallet.Outgoing = BigInt(wallet.Outgoing)+BigInt(pendingInfo.TO_Amount)+BigInt(pendingInfo.TO_Fee);
            }

            if(wallet.Address === pendingInfo.TO_Receiver){
              wallet.Incoming = BigInt(wallet.Incoming)+BigInt(pendingInfo.TO_Amount);
            }            
          });
        }
      }
    });

    setAddressList(addressListRef.current);
  }

  const recalcBalanceFromSummary = () => {
    addressListRef.current.forEach((value) => {
      const ismine = (element) => element.address === value.address;
      let index = summaryListRef.current.findIndex(ismine);
      if(index !== -1){
        value.Balance = BigInt(summaryListRef.current[index].balance);
      }
    });

    setAddressList(addressListRef.current);
    setAddressArray();
  }

  const getLatestConsensus = async () => {
    const response = await fetch(`${API_HOST}/Consensus`);
    const body = await response.json();

    if(response.status !== 200){
      throw Error(body.message);
    }

    return body;
  }

  const getSummaryAPI = async() => {
    const response = await fetch(`${API_HOST}/Summary`);
    const reader = response.body.getReader();

    let readData;
    let {done, value} = await reader.read();

    while(!done){
      if(readData !== undefined){
        readData = Buffer.concat([readData, value]);
      }else{
        readData = value;
      }
      
      const nextRead = await reader.read();
      done = nextRead.done;
      value = nextRead.value;
    }

    // Parse data into zipfile (in memory)
    const zip = await JSZip.loadAsync(readData);
    const filename = Object.keys(zip.files)[0];

    let summaryBytes = await zip.files[filename].async('uint8array');

    let SummaryList = [];
    while(summaryBytes.length > 0){
      let current = summaryBytes.subarray(0,106);
      let address = new TextDecoder().decode(current.subarray(1, current[0]+1));
      let custom = new TextDecoder().decode(current.subarray(42, 42+current[0]));
      
      let balanceArray = current.subarray(82, 90);
      let balance = Buffer.from(balanceArray).readBigInt64LE(0, balanceArray.length);

      const nW = new Wallet(address,custom, balance);
      SummaryList.push(nW);
      // Move Array to next wallet block
      summaryBytes = summaryBytes.subarray(106);
    }

    return SummaryList;
  }

  const formatDate = () => {
    const dateString = new Date(timestamp).toLocaleDateString("en-GB", {timeZone: "Europe/London"})
    const timeString = new Date(timestamp).toLocaleTimeString("en-GB", {timeZone: "Europe/London"})
    return dateString+" "+timeString;
  }
  
  const balance2Currency = (value) => {
    value = String(value);
    while(value.length < 9){
      value = "0"+value;
    }

    let coinStyle = value.substring(0,value.length-8)+"."+value.substring(value.length-8);
    return coinStyle;
  }

  const setAddressArray = () => {
    let addressViewList = [];

    let grandBalance = 0n;
    let c = 0
    addressList.forEach((item) => {
      grandBalance += item.Balance;
      grandBalance -= item.Outgoing;
      let realBalance = item.Balance-item.Outgoing;
      let a = 
      <div key={c}>
        <Row>
          <Col className='col-auto' style={{backgroundColor: 'transparent'}}>
            <Row style={{marginTop: -10,backgroundColor: 'transparent'}} >
              <Col>
                <span style={{fontSize: '0.5rem', backgroundColor: 'transparent'}}>Address</span><br/>
                <span>{ item.custom === "" ? item.Address:item.custom}</span>
              </Col>
            </Row>
            <Row style={{marginTop: -10, backgroundColor: 'transparent'}}>
              <Col>
                <span style={{fontSize: '0.5rem'}}>Incoming</span><br/>
                <span>{balance2Currency(item.Incoming)}</span>
              </Col>
              <Col>
                <span style={{fontSize: '0.5rem'}}>Outgoing</span><br/>
                <span>{balance2Currency(item.Outgoing)}</span>
              </Col>
              <Col>
                <span style={{fontSize: '0.5rem'}}>Balance</span><br/>
                <span>{balance2Currency(realBalance)}</span>
              </Col>
            </Row>
          </Col>
          <Col>
            <ul style={{float: 'right'}} className="list-inline m-0">
                <li>
                    <button onClick={() => setOrigin(item.Address)} className="setOriginBtn btn btn-primary btn-sm rounded-0" type="button" data-toggle="tooltip" data-placement="top" title="Set as Origin">
                      <i className="fa-origin"></i>
                    </button>
                </li>
                <li>
                    <button onClick={() => {setQRcode(item.address);toggleQR(!showQR);}} className="btn btn-success btn-sm rounded-0" type="button" data-toggle="tooltip" data-placement="top" title="Get QR">
                      <i className="fa-qr"></i>
                    </button>
                </li>
                <li>
                    <button className="btn btn-danger btn-sm rounded-0" type="button" data-toggle="tooltip" data-placement="top" title="Delete">
                      <i className="fa-delete"></i>
                    </button>
                </li>
            </ul>
          </Col>
      </Row>
      <hr style={{marginTop: 0}}/>
      </div>;
      addressViewList.push(a);
      c++;
    });

    setAddressViews(addressViewList);
    changeBalance(grandBalance);
  }

  const validateOrder = () => {
    if(fundsOriginRef.current === ""){
      showMessage('Select an address as "Origin"', toast.TYPE.ERROR);
      return;
    }

    if(fundsDestinationRef.current === ""){
      showMessage('Enter a destination address.', toast.TYPE.ERROR);
      return;
    }

    if(fundsAmountRef.current === "" || BigInt(fundsAmountRef.current) === 0n){

      showMessage('Enter a valid amount of noso.', toast.TYPE.ERROR);
      return;
    }

    blockOrigin();
    toggleConfirm(!fundsConfirm);    
  }

  const confirmOrder = () => {
    submitOrder(
      fundsOriginRef.current, 
      fundsDestinationRef.current, 
      fundsAmountRef.current, 
      String(fundsRefRef.current).replaceAll(" ","_"),
      addressListRef.current, 
      summaryListRef.current, 
      blockRef.current,
      sendFromAllRef.current).then((result) => {
        if(result === "-1"){
          showMessage('Not enough funds, select different origin or check "Send from all"', toast.TYPE.ERROR);
          toggleConfirm(!fundsConfirm);
          unBlockOrigin();
        }else{
          showMessage('Order Accepted', toast.TYPE.SUCCESS);
          
          toggleConfirm(!fundsConfirm);
          unBlockOrigin();
          setDestination("");

          setAmountShow("0.00000000");
          lastInputValue.current = "0.00000000";
          fundsAmountRef.current = "000000000";
          toggleSendFromAll(false);
          setAddressList(addressListRef.current);
          recalcBalanceFromSummary();
        }
      });
  }

  const pasteFromClipBoard = async () => {
    const content = await navigator.clipboard.readText();
    setDestination(content);
  }

  const blockOrigin = () => {
    Array.from(document.getElementsByClassName('setOriginBtn')).forEach((btn) => {
      btn.disabled = true;
    });
  }

  const unBlockOrigin = () => {
    Array.from(document.getElementsByClassName('setOriginBtn')).forEach((btn) => {
      btn.disabled = false;
    });
    toggleConfirm(!fundsConfirm);
  }

  const verifyAmount = () => {
    let sendAmount = BigInt(fundsAmountRef.current);
    
    if(sendAmount === 0n){
      toggleValid(undefined);
    }else{
      if(BigInt(String(balanceRef.current).replace(".","")) >= sendAmount+getFee(fundsAmountRef.current)){
        toggleValid(true);
      }else{
        toggleValid(false);
      }
    }
  }

  const formatAmountShow = async (input, value) => {
      let savedPos = input.selectionStart;
      let newChar = value.substring(savedPos-1,savedPos);
      let oldValue = lastInputValue.current;

      const {finalValue, finalPos} = formatAmount(savedPos, newChar, oldValue, value);
      
      setAmountShow(finalValue);
      fundsAmountRef.current = finalValue.replace(".","");
      lastInputValue.current = finalValue;
      
      setTimeout(() => {
        input.setSelectionRange(finalPos, finalPos);
      }, 0);

      verifyAmount();
  }

  return(
  <div className='d-xs-block m-5'>
    <div className='px-3 py-1 rounded bg-white'>
    <Row>
        <Col className='col-auto my-auto'>
          <img src={noso_coin} width={45} alt="NOSO"/>
        </Col>
        <Col className='my-auto' style={{marginLeft: -10}}>
          <Row>
            <Col style={{'fontWeight': 'bold','fontSize': '2rem'}}>
              NOSO
            </Col>
          </Row>

          <Row className='py-0'>
            <Col style={{marginTop: -15}}>
              <span style={{marginLeft: 2,'fontWeight':'bold','fontSize':'0.8rem'}}>WEB WALLET</span>
            </Col>
          </Row>
        </Col>
        <Col className='my-auto'>
          <Button color='' style={{float: 'right'}}>
            <img src={settings} width={45} alt="Settings" />
          </Button>
        </Col>
      </Row>
    </div>

    <div className='my-2'>
      <Row>
        <Col className='col-auto'>
          <Button onClick={() => toggleAlert(!showAlert)}>New Wallet</Button>
        </Col>
        <Col className='px-0 col-auto'>
          <input type='file' style={{display:'none'}} ref={hiddenFilePicker} onChange={handleFileSelection} ></input>
          <Button onClick={handleImport}>Import</Button>
        </Col>
        <Col className='col-auto'>
          <Button onClick={writeWalletFile}>Export</Button>
        </Col>
        <Col className='my-auto'>
          <p style={{fontSize: 25, fontWeight: 'bold', float: 'right'}} className='my-auto'>{balance2Currency(balance)}</p>
        </Col>
      </Row>
    </div>

    <div className='my-2 p-3 rounded bg-white'>
      {
        addressViewList
      }
    </div>

    <div className='p-2 rounded bg-white'>
      <Row className='px-2' style={{display: !showOrderForm ? 'flex':'none'}}>
        <Col className='col-auto my-auto p-2' style={{color:'white'}}>
          <div className={sync ? ('p-2 rounded bg-success'):('p-2 rounded bg-danger')}>
            <img src={block_icon} style={{marginTop: -5}} width={20} alt="Block"/> <strong>{block}</strong>
          </div>
        </Col>
        <Col className='my-auto'>
          {formatDate()}
        </Col>
        <Col className='my-auto'>
          <Button style={{float: "right"}} onClick={() => toggleOrderForm(!showOrderForm)}>Send Funds</Button>
        </Col>
      </Row>
      <Row className='py-3' style={{display: showOrderForm ? 'block':'none', paddingLeft: '3vh'}}>
        <Row>
          <h5>Send funds</h5>
        </Row>
        <Row>
          <Row>
            <Col className='col-auto  FundsLabel'>
              <p>From: </p>
            </Col>
            <Col>
              <p className='FundsInput'>{fundsOrigin}</p>
            </Col>
          </Row>

          <Row>
            <Col className='col-auto FundsLabel'>
              <p>Destination: </p>
            </Col>
            <Col>
              <Row>
                <Col className='col-auto'>
                  <button className='FundsButton' onClick={() => pasteFromClipBoard()}>
                    <i  className='fa-paste' 
                        data-toggle="tooltip" 
                        data-placement="top" 
                        title="Paste">
                    </i>
                  </button>
                </Col>
                <Col>
                  <input className='FundsInput' type='text' onChange={(e) => setDestination(e.target.value)} value={fundsDestination} disabled={fundsConfirm}/>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row>
            <Col className='col-auto FundsLabel'>
              <p>Amount: </p>
            </Col>
            <Col>
              <Row>
                <Col className='col-auto'>
                  <button className='FundsButton' style={{backgroundColor: validAmount === undefined ? '#6c757d':(validAmount?'green':'red')}}>
                    <i  className='fa-amount' 
                        data-toggle="tooltip" 
                        data-placement="top" 
                        title="Reset">
                    </i>
                  </button>
                </Col>
                <Col>
                  <input className='FundsInput' type='text' onChange={(e) => formatAmountShow(e.target, e.target.value)} value={fundsAmountShow} disabled={fundsConfirm}/>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row>
            <Col className='col-auto FundsLabel'>
              <p>Reference: </p>
            </Col>
            <Col>
              <input className='FundsInput' type='text' onChange={(e) => setReference(e.target.value)} disabled={fundsConfirm}/>
            </Col>
          </Row>

          <Row>
            <Col className='col-auto'>
            <label>
              <input type='checkbox' onChange={(e) => toggleSendFromAll(e.target.checked)} disabled={fundsConfirm}/> Send from all
            </label>
            </Col>
            <Col>
              <Row>
                <Col>
                  <Button style={{minWidth: '10vh', float: 'right'}} onClick={() => { fundsConfirm ? unBlockOrigin():toggleOrderForm(!showOrderForm)}}>
                    Back
                  </Button>
                </Col>
                <Col className='col-auto'>
                  <Button
                    style={{display: !fundsConfirm ? 'block':'none' ,minWidth: '10vh', float: 'right'}}
                    onClick={() => validateOrder()}>
                    Send
                  </Button>
                  <Button
                    color='warning'
                    style={{display: fundsConfirm ? 'block':'none' ,minWidth: '10vh', float: 'right'}}
                    onClick={() => confirmOrder()}>
                    Confirm
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Row>
      </Row>
    </div>


    <Modal isOpen={showAlert}>
      <ModalHeader>
        Create a new address
      </ModalHeader>
      <ModalBody>
        You are about to create a new address to save some NOSO, keep in mind that this web wallet is fully local and won't save any kind of information on the "cloud", as soon as you click on <strong>Create</strong> you'll be prompt to save a new wallet.pkw file with all imported addresses and the new one in order for you to save this information in your PC, in other words, if you refresh this website all the addresses will be gone until you re-import that wallet file.
      </ModalBody>
      <ModalFooter>
        <Button onClick={getNewAddress}>
          Create
        </Button>
        {' '}
        <Button onClick={() => toggleAlert(!showAlert)}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>

    <Modal isOpen={showQR}>
      <ModalHeader className='mx-auto'>
        {QRcode}
      </ModalHeader>
      <ModalBody className='mx-auto'>
        <QRCodeSVG value={QRcode}/>
      </ModalBody>
      <ModalFooter>
        <Button onClick={() => toggleQR(!showQR)}>
          Close
        </Button>
      </ModalFooter>
    </Modal>

    <ToastContainer
      position='top-left'
      autoClose={1000}
      hideProgressBar={true}
      draggable
      pauseOnHover
      theme='colored'/>
  </div>
  );
}

export default App;