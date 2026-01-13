pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract MultiBatch {
    address constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    IERC20 public constant targetToken = IERC20(USDC_ADDRESS);

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
