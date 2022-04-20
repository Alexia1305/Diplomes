import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
	preflightCommitment: 'processed'
};

// All your other Twitter and GIF constants you had.



const App = () => {
	// State
	const [walletAddress, setWalletAddress] = useState(null);
	const [inputValue, setInputValue] = useState('');
	const [gifList, setGifList] = useState([]);

  // State pour savoir si Admin, User ou pas
  const [Admin, setAdmin] = useState(false);
  const [User, setUser] = useState(false);

	// Actions
	const checkIfWalletIsConnected = async () => {
		try {
			const { solana } = window;

			if (solana) {
				if (solana.isPhantom) {
					console.log('Phantom wallet found!');
					const response = await solana.connect({ onlyIfTrusted: true });
					console.log(
						'Connected with Public Key:',
						response.publicKey.toString()
					);

					/*
           * Set the user's publicKey in state to be used later!
           */
					setWalletAddress(response.publicKey.toString());
				}
			} else {
				alert('Solana object not found! Get a Phantom Wallet 👻');
			}
		} catch (error) {
			console.error(error);
		}
	};

	const connectWallet = async () => {
		const { solana } = window;

		if (solana) {
			const response = await solana.connect();
			console.log('Connected with Public Key:', response.publicKey.toString());
			setWalletAddress(response.publicKey.toString());
		}
	};
	const sendGif = async () => {
		if (inputValue.length === 0) {
			console.log('No gif link given!');
			return;
		}
		setInputValue('');
		console.log('Gif link:', inputValue);
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);

			await program.rpc.addGif(inputValue, {
				accounts: {
					baseAccount: baseAccount.publicKey,
					user: provider.wallet.publicKey
				}
			});
			console.log('GIF successfully sent to program', inputValue);

			await getGifList();
		} catch (error) {
			console.log('Error sending GIF:', error);
		}
	};

	const onInputChange = event => {
		const { value } = event.target;
		setInputValue(value);
	};
	const getProvider = () => {
		const connection = new Connection(network, opts.preflightCommitment);
		const provider = new Provider(
			connection,
			window.solana,
			opts.preflightCommitment
		);
		return provider;
	};
	const createGifAccount = async () => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			console.log('ping');
			await program.rpc.startStuffOff({
				accounts: {
					baseAccount: baseAccount.publicKey,
					user: provider.wallet.publicKey,
					systemProgram: SystemProgram.programId
				},
				signers: [baseAccount]
			});
			console.log(
				'Created a new BaseAccount w/ address:',
				baseAccount.publicKey.toString()
			);
			await getGifList();
		} catch (error) {
			console.log('Error creating BaseAccount account:', error);
		}
	};

	const renderNotConnectedContainer = () => (
		<button
			className="cta-button connect-wallet-button"
			onClick={connectWallet}
		>
			Connect to Wallet
		</button>
	);

	const renderConnectedContainer = () => {
		// If we hit this, it means the program account hasn't been initialized.
		if (gifList === null) {
			return (
				<div className="connected-container">
					<button
						className="cta-button submit-gif-button"
						onClick={createGifAccount}
					>
						Do One-Time Initialization For GIF Program Account
					</button>
				</div>
			);
		}
		// Otherwise, we're good! Account exists. User can submit GIFs.
		else {
			return (
				<div className="connected-container">
					<form
						onSubmit={event => {
							event.preventDefault();
							sendGif();
						}}
					>
						<input
							type="text"
							placeholder="Entrer un diplome!"
							value={inputValue}
							onChange={onInputChange}
						/>
						<button type="submit" className="cta-button submit-gif-button">
							Submit
						</button>
					</form>
					<div className="gif-grid">
						{/* We use index as the key instead, also, the src is now item.gifLink */}
						{gifList.map((item, index) => (
							<div className="gif-item" key={index}>
								<img src={item.gifLink} />
							</div>
						))}
					</div>
				</div>
			);
		}
	};

	// UseEffects
	useEffect(() => {
		const onLoad = async () => {
			await checkIfWalletIsConnected();
		};
		window.addEventListener('load', onLoad);
		return () => window.removeEventListener('load', onLoad);
	}, []);
	const getGifList = async () => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			const account = await program.account.baseAccount.fetch(
				baseAccount.publicKey
			);

			console.log('Got the account', account);
			setGifList(account.gifList);
		} catch (error) {
			console.log('Error in getGifList: ', error);
			setGifList(null);
		}
	};

	useEffect(
		() => {
			if (walletAddress) {
				console.log('Fetching GIF list...');
				getGifList();
			}
		},
		[walletAddress]
	);
  
  // ________USER
  if(User){ return (

  <header style={{color:'white'}}>

		<div>
			<h3>Rechercher un diplôme</h3>
			<p>En fonction d'un nom, d'un prénom, d'une université et/ou d'une année</p>
		</div>
	// faire un formulaire react 
			
  </header>
  )}


  
  // ________ ADMIN ___________
  if(Admin){
    
  return( 
      <div className="header-container">
          <button onClick={() => setAdmin(false)} > X </button>
					<p className="header">Administrateur</p>
					<p className="sub-text">
						Ajouter des diplomes ✨
					</p>
					{!walletAddress && renderNotConnectedContainer()}
					{/* We just need to add the inverse here! */}
					{walletAddress && renderConnectedContainer()}
				</div>)}



  
  //-------------- ACCUEIL________________-
  if(!User & !Admin){
	 return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<button onClick={() => setAdmin(true)} >
							 ADMINISTRATEUR
						</button>
						<button onClick={() => setUser(true)} >
							 VERIFICATEUR
						</button>
				</div>
				
			</div>
		</div>
	);}
};

export default App;
