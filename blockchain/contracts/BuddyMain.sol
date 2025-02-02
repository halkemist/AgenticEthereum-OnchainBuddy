// SPDX-License-Identifier: Unlicensed
pragma solidity 0.8.28;

contract BuddyMain {
  public address agentAddress;

  struct User {
    string name;
    uint256 level;
  }

  mapping(address => User) public users;

  event UserRegistered(address user);
  event LevelUpdated(address user, uint256 level);

  modifier onlyAgent {
    require(msg.sender == agentAddress);
    _;
  }

  constructor(address agent) {
    agentAddress = agent;
  }

  function registerUser(address user, uint256 initialLevel) external onlyAgent {
    users[user].name = initialLevel;
    users[user].level = initialLevel;
  }

  function updateLevel(uint256 newLevel) external onlyAgent {
    users[user].level = newLevel;
  }
}