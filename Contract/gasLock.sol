// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GasLock {
    enum UnlockSchedule { Hourly, Daily, Weekly, Monthly, Yearly, Deadline }

    event Debug(string message, uint256 value);

    
    struct LockInfo {
        address creator;
        address recipient;
        uint256 amount;
        uint256 createdAt;
        uint256 unlockTimestamp;
        UnlockSchedule schedule;
        uint256 remainingAmount;
    }
    
    mapping(bytes32 => LockInfo) public locks;
    
    event LockCreated(
        bytes32 indexed lockId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint256 unlockTimestamp,
        UnlockSchedule schedule
    );
    
    event WithdrawalMade(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount
    );


    
    function createLock(
    uint256 _unlockTimestamp,
    UnlockSchedule _schedule,
    address _recipient
) external payable returns (bytes32) {
    require(msg.value > 0, "Amount must be greater than 0");
    require(_unlockTimestamp > block.timestamp, "Unlock time must be in the future");
    require(uint256(_schedule) <= uint256(UnlockSchedule.Deadline), "Invalid schedule");
    require(_recipient != address(0), "Invalid recipient address");


    bytes32 lockId = keccak256(abi.encodePacked(
        msg.sender,
        block.timestamp,
        msg.value,
        _unlockTimestamp,
        _schedule,
        _recipient
    ));

    locks[lockId] = LockInfo({
        creator: msg.sender,
        recipient: _recipient,
        amount: msg.value,
        createdAt: block.timestamp,
        unlockTimestamp: _unlockTimestamp,
        schedule: _schedule,
        remainingAmount: msg.value
    });

    emit LockCreated(
        lockId,
        msg.sender,
        _recipient,
        msg.value,
        _unlockTimestamp,
        _schedule
    );

    emit Debug("Lock created", block.timestamp);
    return lockId;
}


    
    function getLockInfo(bytes32 _lockId) external view returns (
        address creator,
        address recipient,
        uint256 amount,
        uint256 createdAt,
        uint256 unlockTimestamp,
        UnlockSchedule schedule,
        uint256 remainingAmount
    ) {
        LockInfo memory lock = locks[_lockId];
        require(lock.creator != address(0), "Lock does not exist");
        
        return (
            lock.creator,
            lock.recipient,
            lock.amount,
            lock.createdAt,
            lock.unlockTimestamp,
            lock.schedule,
            lock.remainingAmount
        );
    }
    
    function calculateWithdrawableAmount(bytes32 _lockId) public view returns (uint256) {
    LockInfo memory lock = locks[_lockId];
    require(lock.creator != address(0), "Lock does not exist");

    // Early exit for fully unlocked or exhausted lock
    if (lock.remainingAmount == 0) return 0;
    if (block.timestamp >= lock.unlockTimestamp) return lock.remainingAmount;

    // Calculate whole duration and time unit in seconds
    uint256 wholeDuration = lock.unlockTimestamp - lock.createdAt;
    uint256 timeUnit = 0;

    if (lock.schedule == UnlockSchedule.Hourly) timeUnit = 3600;
    else if (lock.schedule == UnlockSchedule.Daily) timeUnit = 86400;
    else if (lock.schedule == UnlockSchedule.Weekly) timeUnit = 604800;
    else if (lock.schedule == UnlockSchedule.Monthly) timeUnit = 259200;
    else if (lock.schedule == UnlockSchedule.Yearly) timeUnit = 31536000;
    else timeUnit = wholeDuration; // Default for Deadline or other schedules

    if (timeUnit == 0 || wholeDuration < timeUnit) return 0;

    // Calculate number of periods
    uint256 amountOfPeriods = wholeDuration / timeUnit;
    if (amountOfPeriods == 0) return 0;

    // Calculate amount per period
    uint256 amountPerPeriod = lock.amount / amountOfPeriods;

    // Calculate elapsed time and eligible payouts
    uint256 timeElapsed = block.timestamp - lock.createdAt;
    uint256 eligiblePeriods = timeElapsed / timeUnit;

    // Calculate the total withdrawable amount until now
    uint256 totalPayoutUntilNow = amountPerPeriod * eligiblePeriods;

    // Calculate what remains to be withdrawn
    uint256 alreadyWithdrawn = lock.amount - lock.remainingAmount;
    if (totalPayoutUntilNow > alreadyWithdrawn) {
        return totalPayoutUntilNow - alreadyWithdrawn;
    }

    return 0;
}

    
    function withdraw(bytes32 _lockId) external {
        LockInfo storage lock = locks[_lockId];
        require(lock.creator != address(0), "Lock does not exist");
        require(msg.sender == lock.recipient, "Only recipient can withdraw");
        require(!(block.timestamp >= lock.unlockTimestamp && lock.schedule == UnlockSchedule.Yearly), "Too early to withdraw");
        require(lock.remainingAmount > 0, "No funds remaining");
        
        uint256 withdrawableAmount = calculateWithdrawableAmount(_lockId);
        require(withdrawableAmount > 0, "No funds available for withdrawal");
        
        if (withdrawableAmount > lock.remainingAmount) {
            withdrawableAmount = lock.remainingAmount;
        }
        
        
        
        (bool success, ) = lock.recipient.call{value: withdrawableAmount}("");
        require(success, "Transfer failed");

        lock.remainingAmount -= withdrawableAmount;
        
        emit WithdrawalMade(_lockId, lock.recipient, withdrawableAmount);
    }
}
