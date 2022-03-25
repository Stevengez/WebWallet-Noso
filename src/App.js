import React, {Component, useRef, useState, useEffect} from 'react';
import BigInt from 'big-integer';
import {Buffer} from 'buffer';
import Wallet from './Wallet';
import JSZip from 'jszip';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import PendingInfo from './PendingInfo';

import { createNewAddress, isValidAddress } from './NosoCrypto';

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
  ModalFooter,
  Form,
  Input
} from 'reactstrap';

const API_HOST = process.env.REACT_APP_API_HOST;

const App = () => {
  const [address, setAddress] = useState("");
  const [addressList, setAddressList] = useState([new Wallet("N2dpPzDZ6DZZD8cSTiiMTWGUbX7iuE2","",11000,10,30)]);
  const [addressViewList, setAddressViews] = useState([]);
  const [summaryList, setSummaryList] = useState([]);
  const [pendings, setPendings] = useState("");
  const [balance, changeBalance] = useState(0);
  const [block, changeBlock] = useState(0);
  const [sync, changeSyncStatus] = useState(false);
  const [timestamp, updateTime] = useState(new Date().getTime());
  const [showImport, toggleImport] = useState(false);

  const blockRef = useRef();
        blockRef.current = block;
  const summaryListRef = useRef();
        summaryListRef.current = summaryList;
  const pendingsRef = useRef();
        pendingsRef.current = pendings;
  const addressListRef = useRef();
        addressListRef.current = addressList;

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
    //SyncWallet();
    /*let syncTask = setInterval(() => {
      SyncWallet();
    }, 10000);*/

    // Crypto Testing:
    createNewAddress();

    return () => {
      clearInterval(timerTask);
      //clearInterval(syncTask);
    }

  }, []);

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
    console.log("Syncing Wallet...");
    getLatestConsensus().then((result) => {
      if(result.LastBlock > blockRef.current || summaryListRef.current == undefined){
        getSummaryAPI().then(newList => {
          changeBlock(result.LastBlock);
          changeSyncStatus(true);
          if(pendingsRef.current != result.Pendings){
            setPendings(result.Pendings);
            processPendings();
          }
          setSummaryList(newList);
          recalcBalanceFromSummary();
        });
      }else{
        if(pendingsRef.current != result.Pendings){
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
      if(token != ""){
        let pendingInfo = stringToOrderData(token);
        if(pendingInfo.TO_Type == "TRFR"){
          
          addressListRef.current.forEach((wallet) => {
            if(wallet.Address == pendingInfo.TO_Sender){
              wallet.Outgoing = BigInt(wallet.Outgoing)+BigInt(pendingInfo.TO_Amount)+BigInt(pendingInfo.TO_Fee);
            }

            if(wallet.Address == pendingInfo.TO_Receiver){
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
      const ismine = (element) => element.address == value.address;
      let index = summaryListRef.current.findIndex(ismine);
      if(index != -1){
        value.Balance = BigInt(summaryListRef.current[index].balance) - BigInt(value.Outgoing);
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
      if(readData != undefined){
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
    console.log("Summary Retrieved...");
    const filename = Object.keys(zip.files)[0];

    let summaryBytes = await zip.files[filename].async('uint8array');
    console.log("Total: ",summaryBytes.length);

    let SummaryList = [];
    while(summaryBytes.length > 0){
      let current = summaryBytes.subarray(0,106);
      let address = new TextDecoder().decode(current.subarray(1, current[0]+1));
      let custom = new TextDecoder().decode(current.subarray(42, 42+current[0]));
      
      let balanceArray = current.subarray(82, 90);
      let balance = Buffer.from(balanceArray).readBigInt64LE(0, balanceArray.length);

      let scoreArray = current.subarray(90, 98);
      let score = Buffer.from(scoreArray).readBigInt64LE(0, scoreArray.length);

      let lastopArray = current.subarray(98, 106);
      let lastop = Buffer.from(lastopArray).readBigInt64LE(0, lastopArray.length);
      
      //

      const nW = new Wallet(address,custom, balance);
      SummaryList.push(nW);
      // Move Array to next wallet block
      summaryBytes = summaryBytes.subarray(106);
    }

    console.log("Addresses: ",SummaryList.length);
    return SummaryList;
  }

  const formatDate = () => {
    const dateString = new Date(timestamp).toLocaleDateString("en-GB", {timeZone: "Europe/London"})
    const timeString = new Date(timestamp).toLocaleTimeString("en-GB", {timeZone: "Europe/London"})
    return dateString+" "+timeString;
  }

  const newAddress = () => {
    let exists = false;
    addressListRef.current.forEach((value) => {
      if(value.address == address){
        exists = true;
        return;
      }
    });

    // Hide Modal
    toggleImport(false);

    if(!exists){
      if(isValidAddress(address)){
        addressListRef.current.push(new Wallet(address, "", 0,0,0));
        setAddressList(addressListRef.current);
        processPendings();
        recalcBalanceFromSummary();
      }else{
        console.log("Invalid Address");
      }
    }else{
      console.log("Address already exists");
    }
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

    let grandBalance = 0;
    let c = 0
    addressList.forEach((item) => {
      grandBalance += item.Balance;
      grandBalance -= item.Outgoing;
      let a = 
      <div key={c}>
        <Row>
          <Col className='col-auto'>
            <Row style={{marginTop: -10}}>
              <Col>
                <span style={{fontSize: '0.5rem'}}>Address</span><br/>
                <span>{item.Address}</span>
              </Col>
            </Row>
            <Row style={{marginTop: -10}}>
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
                <span>{balance2Currency(item.Balance)}</span>
              </Col>
            </Row>
          </Col>
          <Col></Col>
      </Row>
      <hr style={{marginTop: 0}}/>
      </div>;
      addressViewList.push(a);
      c++;
    });

    setAddressViews(addressViewList);
    changeBalance(grandBalance);
  }

  return(
  <div className='m-5'>
    <div className='px-3 py-1 rounded bg-white'>
    <Row>
        <Col className='col-auto my-auto'>
          <img src={noso_coin} width={45}/>
        </Col>
        <Col className='my-auto' style={{marginLeft: -10}}>
          <Row>
            <Col style={{'fontWeight': 'bold'},{'fontSize': '2rem'}}>
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
            <img src={settings} width={45} />
          </Button>
        </Col>
      </Row>
    </div>

    <div className='my-2'>
      <Row>
        <Col className='col-auto'>
          <Button>New Wallet</Button>
        </Col>
        <Col className='px-0 col-auto'>
          <Button onClick={() => toggleImport(!showImport)}>Import</Button>
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
      <Row className='px-2'>
        <Col className='col-auto my-auto p-2' style={{color:'white'}}>
          <div className={sync ? ('p-2 rounded bg-success'):('p-2 rounded bg-danger')}>
            <img src={block_icon} style={{marginTop: -5}} width={20}/> <strong>{block}</strong>
          </div>
        </Col>
        <Col className='my-auto'>
          {formatDate()}
        </Col>
      </Row>
    </div>


    <Modal isOpen={showImport}>
      <ModalHeader>
        Add an existing address
      </ModalHeader>
      <ModalBody>
        Type the address.
        <Form>
          <Input type='text' onChange={(e) => setAddress(e.target.value)}></Input>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={newAddress}>
          Add
        </Button>
        {' '}
        <Button onClick={() => toggleImport(!showImport)}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  </div>
  );
}

export default App;