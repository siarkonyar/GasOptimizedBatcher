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

    //NOTE: sign-checks for security can be added.

    function executeBatch(
        address[] calldata senders,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        //call sender.length just once to save gas
        uint256 len = senders.length;
        require(
            recipients.length == len && amounts.length == len,
            "Array mismatch"
        );

        for (uint256 i = 0; i < len; i++) {
            bool success = targetToken.transferFrom(
                senders[i],
                recipients[i],
                amounts[i]
            );
            require(success, "Transfer failed");
        }
    }
}
