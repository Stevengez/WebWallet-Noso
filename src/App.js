import React, {Component, useRef, useState, useEffect} from 'react';
import {Buffer} from 'buffer';
import Wallet from './Wallet';
import JSZip from 'jszip';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import PendingInfo from './PendingInfo';
import SimpleDateFormat from '@riversun/simple-date-format';

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

const App = () => {
  const [address, setAddress] = useState("");
  const [addressList, addAddress] = useState(["hola","ayuda"]);
  const [addressViewList, setAddressViews] = useState([]);
  const [balance, changeBalance] = useState(0);
  const [block, changeBlock] = useState(0);
  const [sync, changeSyncStatus] = useState(false);
  const [timestamp, updateTime] = useState(new Date().getTime());
  const [showImport, toggleImport] = useState(false);

  useEffect(() => {
    setInterval(() => {
      updateTime(timestamp + 1000);
    }, 1000);

    return () => {

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

  const timerTask = () => {
    this.setState({
      Timestamp: this.state.Timestamp+1000
    });
  }

  const getPendingsAPI = async() => {
    const response = await fetch('http://127.0.0.1:5000/Pendings?host=192.210.226.118&port=8080');
    const body = await response.json();

    if(response.status !== 200){
      throw Error(body.message);
    }

    return body;
  }

  const getSummaryAPI = async() => {
    const response = await fetch('http://127.0.0.1:5000/Summary?host=192.210.226.118&port=8080');
    const reader = response.body.getReader();

    let readData;
    let {done, value} = await reader.read();

    while(!done){
      if(readData != undefined){
        readData = Uint8Array.concat(readData, value);
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
      
      if(this.state.address == address){
        console.log("Balance for your accoutn is: ",balance);
        this.setState({
          balance: balance.toString()
        });
      }

      const nW = new Wallet(address,custom, balance);
      SummaryList.push(nW);
      // Move Array to next wallet block
      summaryBytes = summaryBytes.subarray(106);
    }

    console.log("Addresses: ",SummaryList.length);
    return SummaryList;
  }

  /* Legacy Just In Case getSummaryAPI = async() => {
    fetch('http://127.0.0.1:5000/Summary?host=192.210.226.118&port=8080')
    .then(response => response.body)
    .then(body => {
      const reader = body.getReader();
      let data;
      reader.read().then(function processText({ done, value }) {
        if (done) {
          JSZip.loadAsync(data).then((zip) => {
            console.log("Summary Retrieved...");
            Object.keys(zip.files).forEach(function(filename){
              zip.files[filename].async('uint8array').then(function (data){
                
                console.log("Total: ",data.length);
                let SummaryList = [];

                while(data.length > 0){
                  let current = data.subarray(0,106);
                  let address = new TextDecoder().decode(current.subarray(1, current[0]+1));
                  let custom = new TextDecoder().decode(current.subarray(42, 42+current[0]));
                  
                  let balanceArray = current.subarray(82, 90);
                  let balance = Buffer.from(balanceArray).readBigInt64LE(0, balanceArray.length);

                  let scoreArray = current.subarray(90, 98);
                  let score = Buffer.from(scoreArray).readBigInt64LE(0, scoreArray.length);

                  let lastopArray = current.subarray(98, 106);
                  let lastop = Buffer.from(lastopArray).readBigInt64LE(0, lastopArray.length);
                  
                  const nW = new Wallet(address,custom, balance);
                  SummaryList.push(nW);
                  data = data.subarray(106);
                }

                console.log("Addresses: ",SummaryList.length);
                return SummaryList;
              });
            });
          });
          return;
        }
    
        if(data != undefined){
          data = Uint8Array.concat(data, value);
        }else{
          data = value;
        }    
        
        return reader.read().then(processText);
      });


    });
  }*/

  const searchBalance = (address) => {
    this.setState({
      address: address
    });

    this.getSummaryAPI().then((res)=>{
      
    });
  }

  const formatDate = (date) => {
    const dateString = new Date(this.state.Timestamp).toLocaleDateString("en-GB", {timeZone: "Europe/London"})
    const timeString = new Date(this.state.Timestamp).toLocaleTimeString("en-GB", {timeZone: "Europe/London"})
    return dateString+"\n"+timeString;
  }

  const setAddressArray = () => {
    let addressList = [];

    let c = 0
    this.state.address.forEach((item) => {
      let a = <Row key={c}>
        {item}
      </Row>;
      addressList.push(a);
      c++;
    });

    this.setState({
      addressList: addressList
    });
  }

  
  const onAddClicked = () => {
    console.log(address);
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
      <Button>New Wallet</Button>
      <Button onClick={() => toggleImport(!showImport)}>Import</Button>
    </div>

    <div className='my-5 p-3 rounded bg-white'>
      {
        this.state.addressList
      }
    </div>

    <div className='p-2 rounded bg-white'>
      <Row className='px-2'>
        <Col className='col-auto my-auto p-2' style={{color:'white'}}>
          <div className={this.state.Sync ? ('p-2 rounded bg-success'):('p-2 rounded bg-danger')}>
            <img src={block_icon} width={20}/> <strong>Block</strong> {this.state.block}
          </div>
        </Col>
        <Col className='my-auto'>
          {this.formatDate()}
        </Col>
      </Row>
    </div>


    <Modal isOpen={this.state.showImport}>
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
          color="primary"
          onClick={() => this.addAddress(this.input_address)}
            >
          Add
        </Button>
        {' '}
        <Button onClick={this.toggleModal}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  </div>
  );
}

export default App;