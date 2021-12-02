import { Card, Button, Form, Modal } from "react-bootstrap";
import { FiArrowUp, FiX, FiAtSign, FiHash, FiCheckSquare } from "react-icons/fi";
import { FaArrowUp } from 'react-icons/fa';
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useEffect } from 'react';
import axios from 'axios';
import {
	editPostActions,
	editPostSelector,
} from "../../features/post/editPostSlice";
import Image from 'next/image';

import styles from './UploadImage.module.scss';
import VerifyImage from "../../components/verify/VerifyImage";
import DragAndDrop from '../../components/draganddrop/DragAndDrop';

const MIN_CONFIDENCE = 0.55;
const A_CONFIDENCE = 0.7;
const STATUS = {
	allowed: 1,
	warning: 2,
	denied: 3,
}

import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import {
	nftaddress,
	nftmarketaddress
} from '../../config';
import NFT from '../../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import { create as ipfsHttpClient } from 'ipfs-http-client';
//const IpfsHttpClient = require("ipfs-http-client");
const client = ipfsHttpClient({ url: 'https://ipfs.infura.io:5001/api/v0' });

const checkImageStatus = (res) => {
	for (let box of res) {
		if (box.name === 'cat' || box.name === 'dog') {
			if (box.confidence >= MIN_CONFIDENCE) {
				return STATUS['allowed'];
			}
		}
	}
	return ['denied'];
}

const UploadImage = ({ content, onSubmit, isEdit }) => {
	const dispatch = useAppDispatch();
	const editPostData = useAppSelector(editPostSelector);

	useEffect(() => { }, []);


	const [name, setName] = useState("");
	const [price, setPrice] = useState("");
	const [image, setImage] = useState("");
	const [file, setFile] = useState('');
	const [caption, setCaption] = useState('');

	const [show, setShow] = useState(false);
	const [res, setRes] = useState('');

	const [status, setStatus] = useState('');
	const [isMint, setIsMint] = useState(false);

	useEffect(() => {
		if (isEdit) {
			setImage(content.media_URL);
			setCaption(content.caption);
		}
	}, [content])

	const handleChange = (e) => {
		let file = e.target.files[0];
		console.log('sd', file);
		setFile(file);

		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			setImage(reader.result);
		};
	};
	const handleDrop = (file) => {
		console.log('sds', file);

		setFile(file);

		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			setImage(reader.result);
		};
	};
	const handleClose = () => {
		setImage('');
		setStatus('');
	};

	const handleUpload = async () => {
		var bodyFormData = new FormData();
		bodyFormData.append('image', file);
		bodyFormData.append('caption', caption);
		bodyFormData.append('user_id', 3);

		let newForm = new FormData();
		newForm.append('file', file);
		newForm.append('model_choice', 'last');
		newForm.append('result_type', 'json');

		let status = await axios.post('http://localhost:2000/',
			newForm,
			{ headers: { "Content-Type": "multipart/form-data" } }).then(res => {
				console.log(res.data);
				return checkImageStatus(res.data);

			}).catch(err => {
				//
			})
		setStatus(status);
		/*
				axios.post('http://localhost:3001/post',
					bodyFormData,
					{ headers: { "Content-Type": "multipart/form-data" } }).then(res => {
						return res.data
					}).catch(err => {
						//
					})
					*/
		//dispatch(editPostActions.fetch({ data: bodyFormData }));
	};

	const handleEdit = () => {

	}
	const handleClickReset = () => {
		setImage(content.media_URL);
		setCaption(content.caption);
	}

	const [fileUrl, setFileUrl] = useState('');

	const uploadImageIPFS = async () => {

		// Upload image
		try {
			console.log('inupload', file);
			const added = await client.add(
				file,
				{
					progress: (prog) => console.log(`received: ${prog}`)
				}
			)
			const url = `https://ipfs.infura.io/ipfs/${added.path}`
			setFileUrl(url)
			return url
		} catch (error) {
			console.log('Error uploading file: ', error)
		}
	}

	const handleMintAndSell = async () => {
		// Upload image
		const fileUrl = await uploadImageIPFS();

		if (!name || !caption || !price || !fileUrl || fileUrl === '') {
			return
		}

		// Upload to IPFS
		const data = JSON.stringify({
			name, description: caption, image: fileUrl
		})
		try {
			const added = await client.add(data)
			const url = `https://ipfs.infura.io/ipfs/${added.path}`
			/* after file is uploaded to IPFS, pass the URL to save it on Polygon */
			const web3Modal = new Web3Modal()
			const connection = await web3Modal.connect()
			const provider = new ethers.providers.Web3Provider(connection)
			const signer = provider.getSigner()

			// Create the item token
			let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
			let transaction = await contract.createToken(url)
			// After transaction
			let tx = await transaction.wait()
			let event = tx.events[0]
			let value = event.args[2]
			let tokenId = value.toNumber()
			const priceParsed = ethers.utils.parseUnits(price, 'ether')

			// List the item for sale on the marketplace
			contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer)
			let listingPrice = await contract.getListingPrice()
			listingPrice = listingPrice.toString()

			transaction = await contract.createMarketItem(nftaddress, tokenId, priceParsed, { value: listingPrice })
			await transaction.wait();
		} catch (error) {
			console.log('Error uploading file: ', error)
		}
	}

	const handleMint = async () => {


	}
	return (
		<Card className={`${styles['create-post-card']} shadow-xss rounded-xxl`}>
			<Modal show={show} onHide={() => setShow(false)}>
				<VerifyImage res={res} />
			</Modal>
			<Card.Body className="d-flex" style={{ margin: 20 }}>
				<DragAndDrop handleDrop={handleDrop}>
					<div className={`${styles['image-upload']}`}>
						{image && (
							<div className='image-container'>
								<Image
									layout='fill'
									className='image'
									src={image}
									alt="image"

								/>
							</div>
						)}
						{image && <FiX onClick={handleClose} className={`${styles['btn-close']}`} />}
						{!image && (
							<div className={`${styles['browse-file-container']}`}>
								<div className={`${styles['button']} mb-3`} style={{ padding: 8 }}>
									<input type="file" onChange={handleChange} />
									<FaArrowUp className="i-color" />
								</div>
								<h6>Drag and drop or click to upload</h6>
							</div>
						)}
					</div>
					{
						status !== '' &&
						<h3 style={{
							position: 'absolute',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							background: 'rgba(0,0,0,0.5)',
							color: '#fff',
							padding: 10,
						}}>
							{status}
						</h3>
					}
				</DragAndDrop>
				<div
					style={{
						position: 'relative',
						marginLeft: 20,
						width: '100%'
					}}>
					{isMint &&
						<>
							<h3>Name</h3>

							<Form.Control
								value={name}
								onChange={(e) => setName(e.target.value)}
								as="textarea"
								rows={1}
								style={{
									border: '3px solid #F1F1F1',
									borderWidth: 3,
									borderColor: '#F1F1F1',
									resize: 'none',
								}}
								className={`rounded-xxl`}
							/>
							<h3>Price</h3>

							<Form.Control
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								as="textarea"
								rows={1}
								style={{
									border: '3px solid #F1F1F1',
									borderWidth: 3,
									borderColor: '#F1F1F1',
									resize: 'none',
								}}
								className={`rounded-xxl`}
							/>
						</>
					}
					<h3>Tell your story</h3>
					<div className={`rounded-xxl`}
						style={{

							width: '100%',
							position: 'relative',
						}}>
						<Form.Control
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							as="textarea"
							rows={5}
							style={{
								border: '3px solid #F1F1F1',
								borderWidth: 3,
								borderColor: '#F1F1F1',
								resize: 'none',
								borderBottom: '30px solid #F1F1F1 !important',
							}}
							className={`rounded-xxl`}
						/>

						<div
							style={{
								position: 'absolute',
								width: '100%',
								height: 30,
								left: 0,
								bottom: 0,
								background: '#F1F1F1',
								borderRadius: '0 0 15px 15px',
							}}
							className={`${styles['action-button']}`}
						>
							<FiHash /> Tag
							<FiAtSign /> Mention
						</div>
					</div>
					{!isEdit && <Form.Check
						checked={isMint}
						onChange={() => setIsMint(!isMint)}
						label='Create as NFT token (wallet connected require)'
					/>}
					<div >
						{isMint
							? <Button
								style={{
									padding: "0.5rem 1.5rem",
									fontSize: 14,
									borderRadius: 30,
								}}
								variant="primary"
								size="lg"
								onClick={handleMintAndSell}
							>
								Create token and Listing to market
							</Button>
							: <Button
								style={{
									padding: "0.5rem 1.5rem",
									fontSize: 14,
									borderRadius: 30,
								}}
								variant="primary"
								size="lg"
								onClick={handleEdit}
							>
								Post
							</Button>} {" "}
						{isEdit && <Button
							style={{
								padding: "0.5rem 1.5rem",
								fontSize: 14,
								borderRadius: 30,
							}}
							variant="secondary"
							size="lg"
							onClick={handleClickReset}
						>
							Reset
						</Button>
						}
					</div>

				</div>
			</Card.Body>
		</Card >
	);

};

export default UploadImage;
