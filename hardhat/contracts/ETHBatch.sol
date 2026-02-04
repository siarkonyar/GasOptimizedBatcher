// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract ETHBatch {
    address constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    //TODO: explain what is nonce as well
    mapping(address => uint256) public nonces;

    function executeBatch(
        address[] calldata senders,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes[] calldata signatures
    ) external {
        //call sender.length just once to save gas
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

    //TODO: explain why we did in the report
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
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
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
            IERC20(USDC_ADDRESS).transferFrom(sender, recipient, amount),
            "Transfer failed"
        );
    }
}
