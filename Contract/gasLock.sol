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

        if (block.timestamp >= lock.unlockTimestamp){
            return lock.remainingAmount;
        }
        
        if (lock.remainingAmount == 0) return 0;

        uint256 wholeDuration = lock.unlockTimestamp - lock.createdAt; //whole duration
        
        uint256 amountOfPeriods = 0;

        // calculate amount of periods 
        if (lock.schedule == UnlockSchedule.Hourly) {
            amountOfPeriods = wholeDuration / 3600;
        } else if (lock.schedule == UnlockSchedule.Daily) {
            amountOfPeriods = wholeDuration / 86400;
        } else if (lock.schedule == UnlockSchedule.Weekly) {
            amountOfPeriods = wholeDuration / 604800;
        } else if (lock.schedule == UnlockSchedule.Monthly) {
            amountOfPeriods = wholeDuration / 259200;
        } else if (lock.schedule == UnlockSchedule.Yearly) {
            amountOfPeriods = wholeDuration / 31536000;
        } else {
            amountOfPeriods = 1;
        }

        if (amountOfPeriods <= 0){
            return 0;
        }
        // calculate amount per period
        uint256 amountPerPeriod = lock.amount / amountOfPeriods;

        // payout per period
        // uint256 payoutPerPeriod = lock.amount / amountPerPeriod;

        
        // How many periods in time passed?
        uint256 timeElapsed = block.timestamp - lock.createdAt;
        uint256 amountOfEligiblePayouts = 0;

        if (lock.schedule == UnlockSchedule.Hourly) {
            amountOfEligiblePayouts = timeElapsed / 3600;
        } else if (lock.schedule == UnlockSchedule.Daily) {
            amountOfEligiblePayouts = timeElapsed / 86400;
        } else if (lock.schedule == UnlockSchedule.Weekly) {
            amountOfEligiblePayouts = timeElapsed / 604800;
        } else if (lock.schedule == UnlockSchedule.Monthly) {
            amountOfEligiblePayouts = timeElapsed / 259200;
        } else if (lock.schedule == UnlockSchedule.Yearly) {
            amountOfEligiblePayouts = timeElapsed / 31536000;
        } else {
            amountOfPeriods = 0;
        }

        if (amountOfEligiblePayouts == 0){
            return 0;
        }

        uint256 totalPayoutUntilToday = amountPerPeriod * amountOfEligiblePayouts;
        if ((lock.amount -lock.remainingAmount) <= totalPayoutUntilToday ){
            return (totalPayoutUntilToday - (lock.amount -lock.remainingAmount));
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
