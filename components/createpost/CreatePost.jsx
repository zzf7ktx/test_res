import { Card, Form } from 'react-bootstrap';
import CreatePostForm from 'components/forms/CreatePostForm';

import { useState, useEffect } from 'react';
import axiosClient from 'axiosSetup';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter } from 'next/router';

import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { nftaddress, nftmarketaddress } from 'config';
import NFT from 'contracts/NFT.json';
import NFTMarket from 'contracts/NFTMarket.json';
import { client as ipfsClient } from 'app/ipfs';
import { checkImageStatus, checkCaptionStatus } from 'temp';
import { getKeyByValue } from 'helpers';
import { localWeb3 as web3, magicLocal } from 'app/magic';
import InvolveModal from 'components/modal/InvolveModal';

const STATUS = {
  allowed: 1,
  warning: 2,
  denied: 3,
};

const CreatePost = ({ content, onSubmit, isEdit }) => {
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const [loaded, setLoaded] = useState(-1);
  const [isMint, setIsMint] = useState(false);
  const [showInvolve, setShowInvolve] = useState(false);
  const [url, setUrl] = useState('');
  const [contract, setContract] = useState('');
  const [chosen, setChosen] = useState('');
  const [involve, setInvolve] = useState({});

  useEffect(() => {
    getChosenWallet();
  }, []);

  const getChosenWallet = () => {
    try {
      let primaryWallet = localStorage.getItem('primary_wallet');
      let selected;
      if (primaryWallet) {
        primaryWallet = JSON.parse(primaryWallet);
      }
      if (window.ethereum) {
        selected = window.ethereum.selectedAddress;
      }
      const _chosen =
        String(primaryWallet?.asset).toLowerCase() ==
        String(selected).toLowerCase()
          ? 'metamask'
          : null;
      setChosen(_chosen);
    } catch (error) {
      console.log(error);
    }
  };
  const handleUpload = (action) => async (data, setErrors, errors) => {
    let bodyFormData = new FormData();

    bodyFormData.append('image', data.image.file);
    bodyFormData.append('caption', data.caption);
    // Mentions
    const mentionIds = data.mentions.map((value) => value.value);
    bodyFormData.append('mentions', mentionIds.join(','));

    // Check image
    let imageStatus = STATUS['allowed'];
    if (
      action === 'post' ||
      (action === 'put' && data.image.file && data.image.file != '')
    ) {
      let newForm = new FormData();
      newForm.append('file', data.image.file);
      newForm.append('model_choice', 'last');
      newForm.append('result_type', 'json');

      try {
        imageStatus = await axiosClient.post('http://localhost:5000', newForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageStatus = checkImageStatus(imageStatus.data);
      } catch (error) {
        // logging
        console.log(error);
      }
    }
    // Check caption
    let captionStatus = STATUS['allowed'];
    try {
      captionStatus = checkCaptionStatus(data.caption);
    } catch (error) {
      // logging
      console.log(error);
    }
    // Check caption 2
    if (
      data.caption &&
      captionStatus === STATUS['allowed'] &&
      data.caption.split(' ').length >= 4
    ) {
      try {
        let newForm = new FormData();
        newForm.append('text', data.caption);
        newForm.append('model_choice', 'model_1');
        captionStatus = await axiosClient.post(
          'http://localhost:5005/text',
          newForm,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        captionStatus =
          Number(captionStatus.data['result']) === 1.0
            ? STATUS['allowed']
            : STATUS['warning'];
      } catch (error) {
        // logging
        console.log(error);
      }
    }
    // Set errors
    setErrors({
      ...errors,
      caption:
        captionStatus === STATUS['denied']
          ? 'Your caption content some words that are not allowed'
          : captionStatus === STATUS['warning']
          ? 'Your content should be related pet or animals'
          : '',
      image:
        imageStatus === STATUS['allowed']
          ? { type: 'valid', text: 'Allowed' }
          : imageStatus === STATUS['warning']
          ? {
              type: 'warning',
              text: 'Your image should be related pet or animals',
            }
          : { type: 'invalid', text: 'Your image is not allowed.' },
    });
    //
    if (
      imageStatus === STATUS['denied'] ||
      captionStatus === STATUS['denied'] ||
      captionStatus === STATUS['warning']
    ) {
      return;
    }
    bodyFormData.append('image_status', getKeyByValue(STATUS, imageStatus));
    bodyFormData.append('caption_status', getKeyByValue(STATUS, captionStatus));

    let result;
    try {
      result = await axiosClient[action](
        `/posts/${action === 'put' ? content?.id : ''}`,
        bodyFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: function (progressEvent) {
            let percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(percentCompleted);
            setLoaded(percentCompleted);
          },
        }
      );
    } catch (error) {
      // logging
      console.log(error);
    }
    if (result && result.data) {
      mutate('/posts');
      router.push('/post/' + result.data.id);
    }
  };

  const uploadImageIPFS = async (file) => {
    // Upload image
    try {
      const added = await ipfsClient.add(file, {
        progress: (prog) => {
          setLoaded(prog / 3);
          console.log(`received: ${prog}`);
        },
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;

      return url;
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  };

  const handleMintAndSell = async (values, setErrors, errors) => {
    // Upload image
    console.log('Mint', values);
    const fileUrl = await uploadImageIPFS(values?.image?.file);

    if (
      !values.name ||
      !values.caption ||
      !values.price ||
      !fileUrl ||
      fileUrl === ''
    ) {
      return;
    }

    // Upload to IPFS
    const data = JSON.stringify({
      name: values.name,
      description: values.caption,
      image: fileUrl,
    });

    try {
      const added = await ipfsClient.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      // Create the item token
      let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
      let transaction = await contract.createToken(url);
      // After transaction
      let tx = await transaction.wait();
      console.log('lometa', tx);
      let event = tx.events[0];
      let value = event.args[2];
      let tokenId = value.toNumber();
      const priceParsed = ethers.utils.parseUnits(values.price, 'ether');

      // List the item for sale on the marketplace
      contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);
      let listingPrice = await contract.getListingPrice();
      listingPrice = listingPrice.toString();

      transaction = await contract.createMarketItem(
        nftaddress,
        tokenId,
        priceParsed,
        { value: listingPrice }
      );
      await transaction.wait();

      router.push('/market');
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  };
  const estimateGasMint = async (values, setErrors, errors) => {
    try {
      setLoaded(0);
      setShowInvolve(true);

      // Upload image
      const fileUrl = await uploadImageIPFS(values?.image?.file);

      if (!fileUrl || fileUrl === '') {
        return;
      }

      // Upload to IPFS // Apply a template
      const data = JSON.stringify({
        name: values.name,
        description: values.caption,
        image: fileUrl,
      });

      const added = await ipfsClient.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setUrl(url);

      let signer;
      switch (chosen) {
        case 'metamask': {
          const web3Modal = new Web3Modal();
          const connection = await web3Modal.connect();
          const provider = new ethers.providers.Web3Provider(connection);
          signer = await provider.getSigner();
          break;
        }
        default: {
          const provider = new ethers.providers.Web3Provider(
            magicLocal.rpcProvider
          );
          signer = await provider.getSigner();
          break;
        }
      }

      let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
      setContract(contract);
      // Estimate gas and mint token
      const gas = await contract.estimateGas.createToken(url);

      const gasData = await signer.getFeeData();
      const gasFee =
        ethers.utils.formatEther(gasData.gasPrice.toString()) * gas.toNumber();

      setInvolve({
        'Estimated gas fee': gasFee,
        'Gas limit': gas.toString(),
        'Gas Price':
          ethers.utils.formatUnits(gasData.gasPrice.toString(), 'gwei') +
          ' gwei',
        'Max fee per gas':
          ethers.utils.formatUnits(gasData.maxFeePerGas.toString(), 'gwei') +
          ' gwei',
        total: gasFee,
      });
      console.log('fee', gasFee);
    } catch (error) {
      console.log(error);
    } finally {
      setLoaded(-1);
    }
  };
  const handleMint = async () => {
    try {
      setLoaded(50);
      setShowInvolve(false);
      let transaction = await contract.createToken(url);
      router.push('/assets');
    } catch (error) {
      console.log(error);
    } finally {
      setLoaded(-1);
    }
  };

  return (
    <Card className={`border-0 shadow-xss rounded-xxl`}>
      <Card.Body className='d-flex' style={{ margin: 20 }}>
        <CreatePostForm
          onSubmit={
            isMint ? estimateGasMint : handleUpload(isEdit ? 'put' : 'post')
          }
          loaded={loaded}
          values={content}
          isMint={isMint}
          setIsMint={setIsMint}
        />
        <InvolveModal
          show={showInvolve}
          handleClose={() => setShowInvolve(false)}
          data={involve}
          onConfirm={handleMint}
          loading={loaded > -1}
          action={`Create token`}
        />
      </Card.Body>
    </Card>
  );
};

export default CreatePost;
