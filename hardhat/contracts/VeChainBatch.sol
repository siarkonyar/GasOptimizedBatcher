// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVIP180 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract VeChainBatch {
    IVIP180 public immutable targetToken;
    mapping(address => uint256) public nonces;

    constructor(address usdcAddress) {
        targetToken = IVIP180(usdcAddress);
    }

    function executeBatch(
        address[] calldata senders,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes[] calldata signatures
    ) external {
        uint256 len = senders.length;
        require(
            recipients.length == len && amounts.length == len,
            "Array mismatch"
        );

        for (uint256 i = 0; i < len; ) {
            _verifyAndTransfer(
                senders[i],
                recipients[i],
                amounts[i],
                signatures[i]
            );

            unchecked {
                i++;
            } //this is to optimise gas for loops
        }
    }

    function _verifyAndTransfer(
        address sender,
        address recipient,
        uint256 amount,
        bytes calldata signature
    ) internal {
        uint256 currentNonce = nonces[sender];

        bytes32 messageHash = keccak256(
            abi.encodePacked(sender, recipient, amount, currentNonce)
        );

        //EIP-191 Prefix
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19VeChain Signed Message:\n", messageHash)
        );

        nonces[sender] = currentNonce + 1;

        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        //recover and verify
        address recoveredSigner = ecrecover(ethHash, v, r, s);
        require(
            recoveredSigner != address(0) && recoveredSigner == sender,
            "Invalid signature"
        );

        require(
            targetToken.transferFrom(sender, recipient, amount),
            "Transfer failed"
        );
    }
}
