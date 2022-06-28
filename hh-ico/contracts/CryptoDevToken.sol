  // SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";


contract CryptoDevToken is ERC20, Ownable {

    // Price of one CD token
    uint256 public constant tokenPrice = 0.001 ether;

    // Each Crypto Dev NFT will get 10 free tokens but must pay for gas
    uint256 public constant tokensPerNFT = 10 * 10**18;
     // Max token supply is 10,000
    uint256 public constant maxTotalSuplly = 10000 * 10**18;

    // CryptoDev NFT contract
    ICryptoDevs CryptoDevsNFT;

    // Mapping to keep track of tokenIds that have been claimed
    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }

    // Mint CryptoDev Tokens
    function mint(uint256 amount) public payable {
        // eth amount should be equal or greater than tokenPrice * amount
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Incorrect amount of ETH sent");
        // total tokens + amount <= 10,000 otherwise revert
        uint256 amountWithDecimals = amount * 10**18;
        require((totalSupply() + amountWithDecimals) <= maxTotalSuplly, "Exceeded amount of totalSupply");
         // Call internal function from openzeppelin
        _mint(msg.sender, amountWithDecimals);
    }

    function claim() public {
        address sender = msg.sender;
        uint256 balance = CryptoDevsNFT.balanceOf(sender);
        // if balance is zero revert
        require(balance > 0, "You don't own any Crypto Dev NFTs");
        uint256 amount = 0;

        // Loop over balance and get the token ID by sender at a given index
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender,i);
            // if the token has not been claimed increace the amount
            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }
        // if all token ids have been claimed revert transaction
        require(amount > 0, "You have already claimed all the tokens");
        // call internal function from OZ ERC20
        _mint(msg.sender, amount * tokensPerNFT);

    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send ETH");
    }

    // Function to receive Ether msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}



}