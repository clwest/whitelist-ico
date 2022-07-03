import {BigNumber, Contract, providers, utils} from "ethers";
import Head from "next/head";
import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // create a big number `0`

  const zero = BigNumber.from(0);

  // verify wallet is connected
  const [walletConnected, setWalletConnected] = useState(false);
  // loading while mining transactions
  const [loading, setLoading] = useState(false);
  // track number of tokens that can be claimed
  // based on crypto dev nfts held by user
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero)
  // keep track of tokens owned by an address
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero)
  // amount of tokens a user wants to ming
  const [tokenAmount, setTokenAmount] = useState(zero);
  // number of tokens minted out of the 10,000
  const [tokensMinted, setTokensMinted] = useState(zero);
  // gets the owner of the contract
  const [isOwner, setIsOwner] = useState(false);
  // create web3 connection
  const web3ModalRef = useRef();

  // Checks the balance of tokens that can be claimed by a user

  const getTokensToBeClaimed = async () => {
    try {
      // Get metamask
      const provider = await getProviderOrSigner();
      // create an instance of NFT Conttract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      // create a instance of the token contract
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      // get the signer to extract teh address oof the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // get the address associated to the signer
      const address = await signer.getAddress();
      // call balanceOf from NFT contract
      const balance = await nftContract.balanceOf(address);
      // balance is a Big Number and thus we would compare it to Big Nubmer zero
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        // amount keeps track of unclaimed tokens
        var amount = 0;
        for (var i = 0; i < balance; i++ ) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        // tokensToBeClaimed has been initialized to a Big Number and needs to be 
        // set to big bumber and then set its value
        setTokensToBeClaimed(BigNumber.from(amount));
      }

    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  }

  // check the balance of CD tokens held by an address
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      // get provider no need for signer as we are only reading state
      const provider = await getProviderOrSigner();
      // Create an instance of the token Contract
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      // extract address of signer connected to MM
      const signer = await getProviderOrSigner(true);
      // get address of signer
      const address = await signer.getAddress();
      // call balanceOf from token contract
      const balance = await tokenContract.balanceOf(address)
      // balance is already a big number
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  };

  // Mint amount number of tokens to a given address
  const mintCryptoDevToken = async (amount) => {
    try {
      // Need signer to write transaction
      const signer = await getProviderOrSigner(true);
      // Create contract
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
      // Each token is 0.001 ether the calue to send is 0.001 * amount
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        // value signifies the cost of one crypto dev token which is 0.001 * amount
        // parsing 0.001 string ito ether using utils libarary
        value: utils.parseEther(value.toString()),
      })
      setLoading(true);
      await tx.wait()
      setLoading(false);
      window.alert("Sucessfully minted Crypto Dev Tokens")
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted()
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  }

  // Help user claim Tokens
  const claimCryptoDevTokens = async () => {
    try {
    // get signer and create contract instance
    const signer = await getProviderOrSigner(true);
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

    const tx = await tokenContract.claim()
    setLoading(true);
    // wait for transaction to get mined
    await tx.wait()
    setLoading(false);
    window.alert("Successfully claimed CD Tokens");
    await getBalanceOfCryptoDevTokens();
    await getTotalTokensMinted();
    await getTokensToBeClaimed();
    } catch (err) {
    console.error(err)
   }
  }

  // Retrieves how many tokens have been minted
  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider)

      const _tokensMinted = await tokenContract.totalSupply()
      setTokensMinted(_tokensMinted)
    } catch (err) {
      console.error(err)
    }
  }

    // withdraw eth and tokens by calling withdraw function
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner()
    } catch (err) {
      console.error(err);
    }
  }
  // get the contract owner by conneted address
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      // call the owner function from the contract
      const _owner = await tokenContract.owner()
      // get signer 
      const signer = await getProviderOrSigner(true);
      // get Address
      const address = await signer.getAddress()
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true)
      }
    } catch (err) {
      console.error(err)
    }
  }


  // Create a Ethereum RPC
  const getProviderOrSigner = async (needSigner=false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // Makes sure user  is connected to Rinkeby
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !==4 ) {
      window.alert("Please be sure you are connected to Rinkeby!")
      throw new Error("Change network to Rinkeby")
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  // Connect to MM
  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true);
    } catch (err) {
      console.error(err)
    }
  }
  // useEffect is used to change state of the website
  // whenever the value of walletConnected changes this effect will be called 
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  // render buttons based on state
  const renderButton = () => {
    if (loading) {
      // If we are currently waiting on mining
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // if owner is connected withdrawCoins is called
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      )
    }
    // if tokens to be claimed are greater than 0 return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      )
    }
    return (
      <div style={{display: "flex-col"}}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from convert the e.target.value to big number
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>
        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
          >
            Mint Tokens
        </button>
      </div>
    )
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div> 
          <h1 className={styles.title}> Welcome to Crypto Devs IC0!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
        {walletConnected ? (
          <div>
            <div className={styles.description}>
              {/* Format Ether helps convert BigNumber to string*/}
              you have minted {utils.formatEther(balanceOfCryptoDevTokens)}{" "} Crypto
              Dev Tokens
            </div>
            <div className={styles.description}>
              Overall {utils.formatEther(tokensMinted)}/10,000 have been minted!
            </div>
            {renderButton()}
            </div>
        ) : (
          <button onClick={connectWallet} className={styles.button}>
            Connect your Wallet To the Rinkeby network
          </button>
        )} 
      </div>
      <div>
        <img className={styles.image} src="./0.svg" />
      </div>
      </div>
      <footer className={styles.footter}>
        Made with &#10084; by Crypto Donkey!
      </footer>
    </div>
  );
}