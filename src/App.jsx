import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import React from 'react';
import idl from './idl.json';


import {Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {Program, Provider, web3} from '@project-serum/anchor';

const {SystemProgram, Keypair} = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = 'madhavjha';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;


const TEST_GIFS = [
  'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
  'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
  'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
  'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]




const App = () => {

  const [walletAddress, setWalletAddress] = React.useState(null);
  const [message, setMessage] = React.useState(null);
  const [gifList, setGifList] = React.useState(null);
  const [inputValue, setInputValue] = React.useState('');
  window.gifList = gifList;

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(connection, window.solana, opts.preflightCommitment);
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await  program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("error", error);
      setGifList(null);
    }
  }

  const sendGif = async () => {
  if (inputValue.length === 0) {
    console.log("No gif link given!")
    return
  }
  console.log('Gif link:', inputValue);
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.addGif(inputValue, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });
    console.log("GIF successfully sent to program", inputValue)

    await getGifList();
  } catch (error) {
    console.log("Error sending GIF:", error)
  }
};

  const renderConnectedContainer = () => {
    if (gifList === null) {
    return (
      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
    )
  }
    return <div className="connected-container">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendGif();
          setInputValue('');
        }}
      >
        <input
          type="text"
          placeholder="Enter gif link!"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="cta-button submit-gif-button">
          Submit
        </button>
      </form>
      <div className="gif-grid">
        {/* Map through gifList instead of TEST_GIFS */}
        {gifList.map(({gifLink}, id ) => (
          <div className="gif-item" key={id}>
            <img src={gifLink} alt={gifLink} />
          </div>
        ))}
      </div>
    </div>
  }

  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (solana && solana.isPhantom) {
        console.log("Phantom wallet found")
        const resp = await solana.connect()
        setWalletAddress(resp.publicKey.toString())
        await getGifList();
        setMessage({ type: "success", message: `Yay! you are connected` });
      } else {
        setMessage({ type: "error", message: "No Phantom wallet found" });
      }
    } catch (error) {
      console.log(error);
    }
  }
  

  const ShowResult = () => message && <p style={message.type === 'success' ? { color: 'green' } : { color: 'red' }}>{message.message}</p>

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">Portal</p>
          <p className="sub-text">
            Aloha! let's build this!
          </p>
          {walletAddress && <p style={{ color: 'green' }}>{walletAddress}</p>}
          {message && <ShowResult />}

          {!walletAddress && <button className="cta-button connect-wallet-button" onClick={connectWallet}>
            Connect to Wallet
          </button>}
        </div>
        <div>
          {walletAddress && renderConnectedContainer()}

        </div>

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;



