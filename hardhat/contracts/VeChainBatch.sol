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
    address constant USDC_ADDRESS = 0xC0C789a13A69859d3ae7BDb3fE4fA1625D20FD65;
    IVIP180 public constant targetToken = IVIP180(USDC_ADDRESS);
    mapping(address => uint256) public nonces;

    struct BatchTransaction {
        address sender;
        address recipient;
        uint256 amount;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    function executeBatch(BatchTransaction[] calldata txs) external {
        uint256 len = txs.length;

        for (uint256 i = 0; i < len; i++) {
            // Access data via txs[i].field
            address currentSender = txs[i].sender;

            bytes32 messageHash = keccak256(
                abi.encodePacked(
                    currentSender,
                    txs[i].recipient,
                    txs[i].amount,
                    nonces[currentSender],
                    address(this)
                )
            );

            bytes32 ethSignedMessageHash = keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    messageHash
                )
            );

            address signer = ecrecover(
                ethSignedMessageHash,
                txs[i].v,
                txs[i].r,
                txs[i].s
            );
            require(signer == currentSender, "Invalid signature");

            nonces[currentSender]++;

            bool success = targetToken.transferFrom(
                currentSender,
                txs[i].recipient,
                txs[i].amount
            );
            require(success, "Transfer failed");
        }
    }
}
