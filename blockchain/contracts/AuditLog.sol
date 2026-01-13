// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuditLog {
    event LogRecorded(
        address indexed user,
        string action,
        bytes32 logHash,
        uint256 timestamp
    );

    function recordLog(
        string memory action,
        bytes32 logHash
    ) public {
        emit LogRecorded(
            msg.sender,
            action,
            logHash,
            block.timestamp
        );
    }
}
