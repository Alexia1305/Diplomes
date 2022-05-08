//import

import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import idl from './idl.json';
import kp from './keypair.json';
import Dropdown from 'react-dropdown';
import photo from './diplome.jpg';
import im from './error.png';
import imm from './dipenv.png';

// solana
const { SystemProgram, Keypair } = web3;

// accès au keypair for the account that will hold the Diplome data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// accès à notre programme id  grace au IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
	preflightCommitment: 'processed'
};

const App = () => {
	// State
	const [walletAddress, setWalletAddress] = useState(null);
	const [inputValue, setInputValue] = useState(' ');
	const [inputs, setInputs] = useState('');
	const [diplomeList, setDiplomeList] = useState([]);
	const [autorisation, setAutorisation] = useState([]);
	// State pour savoir si Admin, User ou pas
	const [Admin, setAdmin] = useState(false);
	const [User, setUser] = useState(false);

	// Formulaire admin, initialisation des valeurs d'input
	const form = document.getElementById('form');
	const nom = document.getElementById('nom');
	const prenom = document.getElementById('prenom');
	const date = document.getElementById('date');
	const formation = document.getElementById('formation');
	const distinction = document.getElementById('distinction');

	// initialisation des variables d'état pour la vérification des champs
	const [verifnom, setVerifnom] = useState(false);
	const [verifprenom, setVerifprenom] = useState(false);
	const [verifdate, setVerifdate] = useState(false);
	const [verifformation, setVerifformation] = useState(false);
	const [verifdistinction, setVerifdistinction] = useState(false);
	const [envoyer, setEnvoyer] = useState(0); // 0 etat de base
	// 1=envoyé
	// -1 echec

	// ******************FCT ADMIN******************************************************************************

	//_____________________form admin ____________________

	// Vérification des inputs pour le formulaire admin
	function checkInputs() {
		//on initialise les états des vérification sur false : au départ, tous les champs sont vides
		setVerifnom(false);
		setVerifprenom(false);
		setVerifdate(false);
		setVerifformation(false);
		setVerifdistinction(false);
		// le trim permet de retirer les espaces en fin et en début des inputs
		// cela permet d'empecher les champs remplis par un espace d'être valides
		const nameValue = nom.value.trim();
		const prenomValue = prenom.value.trim();
		const dateValue = date.value.trim();
		const formationValue = formation.value.trim();
		const distinctionValue = distinction.value.trim();

		if (nameValue === '') {
			//si le champ est vide
			setErrorFor(nom, 'Veuillez remplir ce champ !');
			//on va dans la fonction setErrorFor pour ce champ et on affiche un message d'erreur
		} else {
			setSuccessFor(nom);
			//si le champ est rempli, on va dans la fonction setSuccessFor pour ce champ
			//on passe setVerifnom en true car c'est OK maintenant
			setVerifnom(true);
		}
		if (prenomValue === '') {
			setErrorFor(prenom, 'Veuillez remplir ce champ !');
		} else {
			setSuccessFor(prenom);
			setVerifprenom(true);
		}
		if (dateValue === '') {
			setErrorFor(date, 'Veuillez remplir ce champ !');
		} else {
			setSuccessFor(date);
			setVerifdate(true);
		}
		if (formationValue === '') {
			setErrorFor(formation, 'Veuillez remplir ce champ !');
		} else {
			setSuccessFor(formation);
			setVerifformation(true);
		}
		if (distinctionValue === '') {
			setErrorFor(distinction, 'Veuillez remplir ce champ !');
		} else {
			setSuccessFor(distinction);
			setVerifdistinction(true);
		}
	}

	// messages Erreurs ou Success dus à la vérification dans checkInputs
	function setErrorFor(input, message) {
		//fonction erreur définie pour tous les inputs donc via parentElement (variable globale)
		const formControl = input.parentElement;
		const small = formControl.querySelector('small');
		formControl.className = 'form-control error';
		//afin d'afficher l'erreur via la pertie css
		small.innerText = message;
	}

	function setSuccessFor(input) {
		//pareil ici mais cette fois sans message d'erreur à afficher
		const formControl = input.parentElement;
		formControl.className = 'form-control success';
	}

	// gestion des inputs et création de la variable diplome
	// ici on met les inputs dans une variable de superposition où elles sont séparées par des "///" dans la variable diplome
	const handleChange = event => {
		const name = event.target.name;
		const value = event.target.value;
		setInputs(values => ({ ...values, [name]: value }));
		let diplome =
			inputs.nom +
			'///' +
			inputs.prenom +
			'///' +
			inputs.date +
			'///' +
			inputs.formation +
			'///' +
			inputs.distinction +
			'';
		setInputValue(diplome);
	};
	// dernière mise à jour lors de la validation
	// sinon il manquait une lettre au dernier champ rempli, donc on met à jour les valeurs entrées pour les avoir en entier
	const handleChangeEnd = () => {
		let diplome =
			inputs.nom +
			'///' +
			inputs.prenom +
			'///' +
			inputs.date +
			'///' +
			inputs.formation +
			'///' +
			inputs.distinction +
			'';
		setInputValue(diplome);
	};
	const onInputChange = event => {
		const { value } = event.target;
		setInputValue(value);
	};

	//_____________________ Envois Diplome ____________________
	const sendDiplome = async () => {
		//on vérifie si les champs sont tous remplis par des valeurs
		if (
			verifnom === false ||
			verifprenom === false ||
			verifdate === false ||
			verifformation === false ||
			verifdistinction === false
		) {
			return;
		}
		//si la valeur de l'input est de taille 0, on ne permet pas la transaction et on affiche un message dans la console
		if (inputValue.length === 0) {
			console.log('No diplome given!');
			return;
		}

		setInputValue('');
		console.log('Diplomevar:', inputValue);
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);

			await program.rpc.addDiplome(inputValue, {
				accounts: {
					baseAccount: baseAccount.publicKey,
					user: provider.wallet.publicKey
				}
			});
			console.log('Diplome successfully sent to program', inputValue);
			setEnvoyer(1);

			setInputValue('');

			await getDiplomeList();
		} catch (error) {
			console.log('Error sending Diplome:', error);
			setEnvoyer(-1);
		}
	};

	//_____________________portefeuille et accès  ____________________

	// verifier si connecter au portefeuille
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
				console.log('Solana object not found! Get a Phantom Wallet 👻');
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

	const getProvider = () => {
		const connection = new Connection(network, opts.preflightCommitment);
		const provider = new Provider(
			connection,
			window.solana,
			opts.preflightCommitment
		);
		return provider;
	};

	//__________________Première initialisation du site_______________

	const createDiplomeAccount = async () => {
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
			await getDiplomeList();
			await getAutorisation();
		} catch (error) {
			console.log('Error creating BaseAccount account:', error);
		}
	};

	// ****************** AFFICHAGE ADMIN*****************************************************************************

	//__________________ Affichage si pas connecté _______________
	const renderNotConnectedContainer = () => (
		<div className="message">
			<button className="connect-wallet-button" onClick={connectWallet}>
				Connect to Wallet
			</button>
		</div>
	);

	//__________________ Affichage si connecté _______________

	const renderConnectedContainer = () => {
		if (diplomeList === null) {
			// pas encore d'initialisation
			return (
				<div className="connected-container">
					<button
						className="cta-button submit-diplome-button"
						onClick={createDiplomeAccount}
					>
						Do One-Time Initialization For Diplome Program Account
					</button>
				</div>
			);
		}
		// pas l'autorisation
		if (!autorisation.includes(walletAddress.toString())) {
			return (
				<div className="connected-container">
					<h1> Vous n'êtes pas autorisé à utiliser cette ressource</h1>
					<p> {'Les portefeuilles autorisés : '} </p>
					<ol>
						{autorisation.map(portefeuille => (
							<li key={portefeuille}>{portefeuille}</li>
						))}
					</ol>

					<p> Votre portefeuille</p>
					<p>{'' + walletAddress.toString()}</p>
				</div>
			);
		}
		//  compte administrateur si portefeuille connecté et autorisé  .
		else {
			// echec de l'envoi
			if (envoyer === -1) {
				return (
					<div className="message">
						<img src={im} height="auto" />
						<p className="sub-text"> Echec de la transaction </p>
						<button className="connect-button" onClick={() => setEnvoyer(0)}>
							{' '}
							REESSAYER{' '}
						</button>
					</div>
				);
			}
			// envoi réussi
			if (envoyer === 1) {
				return (
					<div className="message">
						<img src={imm} height="auto" />
						<h1> Diplome envoyé </h1>
						<button className="connect-button" onClick={() => setEnvoyer(0)}>
							{' '}
							Envoyer un autre diplome{' '}
						</button>
					</div>
				);
			}

			// pas encore envoyé
			if (envoyer === 0) {
				return (
					<div className="formulaireRecherche">
						<link
							href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
							rel="stylesheet"
						/>
						<form
							id="form"
							class="form"
							onSubmit={event => {
								handleChangeEnd();
								event.preventDefault();
								checkInputs(); //on vérifie si les champs sont remplis
								sendDiplome(); //on effectue l'envoi de diplômes conditionné par le checkInputs
							}}
						>
							<div class="form-control">
								<label>Entrer le nom:</label>
								<input
									id="nom"
									type="text"
									name="nom"
									placeholder="Nom"
									value={inputs.nom || ''}
									onChange={handleChange}
								/>
								<i class="fas fa-check-circle" />
								<i class="fas fa-exclamation-circle" />
								<small> Error message </small>
							</div>
							<div class="form-control">
								<label>Entrer le prénom:</label>
								<input
									id="prenom"
									type="text"
									name="prenom"
									placeholder="Prénom"
									value={inputs.prenom || ''}
									onChange={handleChange}
								/>
								<i class="fas fa-check-circle" />
								<i class="fas fa-exclamation-circle" />
								<small> Error message </small>
							</div>
							<div class="form-control">
								<label>Entrer la date:</label>
								<input
									id="date"
									type="date"
									name="date"
									placeholder="Date.."
									value={inputs.date || ''}
									onChange={handleChange}
								/>

								<i class="fas fa-exclamation-circle" />
								<small> Error message </small>
							</div>
							<div class="form-control">
								<label>Entrer la formation:</label>
								<input
									id="formation"
									type="text"
									name="formation"
									placeholder="Formation"
									value={inputs.formation || ''}
									onChange={handleChange}
								/>
								<i class="fas fa-check-circle" />
								<i class="fas fa-exclamation-circle" />
								<small> Error message </small>
							</div>

							<div class="form-control">
								<label>Entrer la distinction:</label>
								<input
									id="distinction"
									type="text"
									name="distinction"
									placeholder="Distinction"
									value={inputs.distinction || ''}
									onChange={handleChange}
								/>

								{/*<select id="distinction" name="distinction"  >
                 
              <option value="SM" onChange={handleChange}> Sans Mention </option>
              <option value={inputs.distinction || 'S'} onChange={(e) => handleChange(e)}>Satisfaction </option>
              <option value="D"onChange={(e) => handleChange(e)}>Distinction </option>
              <option value="GD" onChange={(e) => handleChange(e)}>Grande distinction</option>
              <option value="LPGD" onChange={(e) => handleChange(e)}>La plus grande distinction</option>
              </select>  */}

								<i class="fas fa-exclamation-circle" />
								<small> Error message </small>
							</div>

							<input className="connect-button" type="submit" />
						</form>
					</div>
				);
			}
		}
	};

	// ****************** FCT Recuperation de SOLANA ****************************************************************

	useEffect(() => {
		const onLoad = async () => {
			await checkIfWalletIsConnected();
		};
		window.addEventListener('load', onLoad);
		return () => window.removeEventListener('load', onLoad);
	}, []);
	// Récupération de la liste de diplomes
	const getDiplomeList = async () => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			const account = await program.account.baseAccount.fetch(
				baseAccount.publicKey
			);

			console.log('Got the account', account);
			setDiplomeList(account.diplomeList);
		} catch (error) {
			console.log('Error in getDiplomeList: ', error);
			setDiplomeList(null);
		}
	};
	// Récupération des autorisations
	const getAutorisation = async () => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			const account = await program.account.baseAccount.fetch(
				baseAccount.publicKey
			);

			console.log('Got the account', account);
			setAutorisation(account.autorise);
		} catch (error) {
			console.log('Error in getAutorisation: ', error);
			setDiplomeList(null);
		}
	};

	// ****************** FCT VERIF USER  **************************************************************************
	async function putElementDiplomeInList(inputs) {
		const dataARenvoier = [];

		for (var i = 0; i < diplomeList.length; i++) {
			var listElementDiplome = diplomeList[i].diplomeVar.split('///');
			console.log(inputs.prenom);
			//Cas ou les 2 champs sont remplis
			if (inputs.nom != undefined && inputs.prenom != undefined) {
				if (
					listElementDiplome[0] == inputs.nom &&
					listElementDiplome[1] == inputs.prenom
				) {
					dataARenvoier.push(listElementDiplome);
				}
			}
			//Cas ou le champ nom est rempli
			if (
				inputs.nom != undefined &&
				(inputs.prenom == undefined || inputs.prenom != '<empty string>')
			) {
				if (listElementDiplome[0] == inputs.nom) {
					dataARenvoier.push(listElementDiplome);
				}
			}
			//Cas ou le champ prenom est rempli
			if (inputs.nom == undefined && inputs.prenom != undefined) {
				if (listElementDiplome[1] == inputs.prenom) {
					dataARenvoier.push(listElementDiplome);
				}
			}
		}

		return [dataARenvoier];
	}

	// formulaire user

	function MyForm() {
		const [inputs, setInputs] = useState({});

		const handleChange = event => {
			const name = event.target.name;
			const value = event.target.value;
			setInputs(values => ({ ...values, [name]: value }));
		};

		const handleSubmit = event => {
			event.preventDefault();

			var test = putElementDiplomeInList(inputs);

			test.then(function(result) {
				var personne = result[0];
				const type = [
					'Nom',
					'Prenom',
					'Date du diplome',
					'Formation',
					'Distinction'
				];

				for (let i = 0; i < personne.length; i++) {
					var aAfficherTotal =
						aAfficherTotal + '<br>' + '<b>Personne : ' + i + '</b> ✨<br>';
					for (let j = 0; j < personne[i].length; j++) {
						var aAfficher = personne[i][j];
						console.log(aAfficher);
						var aAfficherTotal =
							aAfficherTotal + type[j] + ' : ' + aAfficher + '</br>';
					}
					var aAfficherTotal = aAfficherTotal + '</br></br></br>';
				}
				if (aAfficherTotal != undefined) {
					aAfficherTotal = aAfficherTotal.replace('undefined', '');
					document.getElementById('test').innerHTML = aAfficherTotal;
				} else {
					document.getElementById('test').innerHTML = 'Personne introuvable !';
				}
			});
		};

		return (
			<form onSubmit={handleSubmit}>
				<p className="h">VERIFICATEUR</p>
				<p className="s"> Vérifiez l'authenticité de diplomes ✨</p>
				<label>
					Entrez le nom:
					<input
						type="text"
						name="nom"
						placeholder="Nom"
						value={inputs.nom || ''}
						onChange={handleChange}
					/>
				</label>
				<label>
					Entrez le prénom:
					<input
						type="text"
						name="prenom"
						placeholder="Prénom"
						value={inputs.prenom || ''}
						onChange={handleChange}
					/>
				</label>

				<input className="connect-button" type="submit" />
				<div id="test" />
			</form>
		);
	}

	//------------------------------------------------
	useEffect(
		() => {
			if (walletAddress) {
				console.log('Fetching DIPLOME list...');
				getDiplomeList();
				console.log('Fetching autorisation');
				getAutorisation();
			} else {
				getDiplomeList();
				getAutorisation();
			}
		},
		[walletAddress]
	);

	// ****************** MENU   *******************************************************************************
	// ________USER
	if (User) {
		return (
			<header>
				<button onClick={() => setUser(false)}> X </button>

				<div className="formulaireRecherche">
					<MyForm />
				</div>
			</header>
		);
	}

	// ________ ADMIN ___________
	if (Admin) {
		return (
			<div className="App">
				<div className="header-container">
					<button
						onClick={() => {
							setAdmin(false);
							setEnvoyer(0);
						}}
					>
						{' '}
						X{' '}
					</button>
					<p className="header">Administrateur</p>
					<p className="sub-text"> Ajouter des diplomes ✨</p>
				</div>
				{/* pour se connecter au portefeuille si ce n'est pas le cas */}
				{!walletAddress && renderNotConnectedContainer()}
				{/* quand le portefeuille est connecté  */}
				{walletAddress && renderConnectedContainer()}
			</div>
		);
	}

	//-------------- ACCUEIL________________-
	if (!User & !Admin) {
		return (
			<div className="App">
				<div className="container">
					<h1 className="gradient-text" c>
						{' '}
						Bienvenue sur notre vérificateur de diplômes en ligne !
					</h1>
					<img src={photo} width="400" height="auto" />

					<div className="header-container1">
						<button
							className="connecttt-button"
							onClick={() => {
								setUser(true);
								putElementDiplomeInList();
							}}
						>
							VERIFICATEUR
						</button>
						<button className="connecttt-button" onClick={() => setAdmin(true)}>
							ADMINISTRATEUR
						</button>
					</div>
				</div>
			</div>
		);
	}
};

export default App;
