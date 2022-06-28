// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

interface ICryptoDevs {
    // Use balacnceOF to enumerate all owners tokens in

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);

    function balanceOf(address owner) external view returns (uint256 balance);
}