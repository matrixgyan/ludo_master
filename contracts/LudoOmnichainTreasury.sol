// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function decimals() external view returns (uint8);
}

/**
 * @title LudoOmnichainTreasury
 * @dev Production Multi-Chain Escrow & Treasury Smart Contract for Ludo Platform.
 * Supports:
 * - Direct USDT deposits & user vault balances across 7 EVM chains
 * - Match entry fee escrow locking
 * - Authoritative match settlement (Winner prize + Platform fee rake)
 * - EIP-712 meta-transactions for gasless player match authorizations
 * - Cross-chain withdrawal execution with on-chain fee deductions (Gas + Platform + Routing)
 */
contract LudoOmnichainTreasury {
    // Contract Owner / Admin
    address public owner;
    // Platform Treasury Address to receive platform rake / fees
    address public treasuryWallet;
    // Authoritative Server Relayer Address authorized to settle matches & process withdrawals
    address public relayerOracle;

    // Supported USDT Token Contract on this chain
    IERC20 public immutable usdtToken;
    uint8 public immutable usdtDecimals;

    // EIP-712 Domain Separator components
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant JOIN_MATCH_TYPEHASH = keccak256(
        "JoinMatch(address player,string matchId,uint256 entryFee,uint256 nonce,uint256 deadline)"
    );

    // Player nonces for replay attack prevention
    mapping(address => uint256) public nonces;

    // Player deposited vault balances on this contract (in raw token units)
    mapping(address => uint256) public vaultBalances;

    // Match Escrow Struct
    struct MatchEscrow {
        string matchId;
        uint256 entryFee;
        uint256 totalEscrowed;
        address[] players;
        bool isSettled;
        bool isCancelled;
        address winner;
        uint256 winnerPayout;
        uint256 platformRake;
    }

    // Match ID => Match Escrow Details
    mapping(string => MatchEscrow) public matchEscrows;

    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Events
    event DepositReceived(address indexed player, uint256 amount, uint256 newBalance);
    event MatchCreated(string indexed matchId, uint256 entryFee);
    event PlayerJoinedMatch(string indexed matchId, address indexed player, uint256 entryFee);
    event MatchSettled(
        string indexed matchId,
        address indexed winner,
        uint256 winnerPayout,
        uint256 platformRake,
        uint256 timestamp
    );
    event MatchRefunded(string indexed matchId, uint256 refundPerPlayer);
    event WithdrawalDispatched(
        address indexed recipient,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 totalFeesDeducted,
        string destinationChain
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier onlyRelayerOrOwner() {
        require(msg.sender == relayerOracle || msg.sender == owner, "Only relayer or owner");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(
        address _usdtToken,
        address _treasuryWallet,
        address _relayerOracle
    ) {
        require(_usdtToken != address(0), "Invalid USDT token address");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        require(_relayerOracle != address(0), "Invalid relayer address");

        owner = msg.sender;
        treasuryWallet = _treasuryWallet;
        relayerOracle = _relayerOracle;
        usdtToken = IERC20(_usdtToken);
        usdtDecimals = usdtToken.decimals();
        _status = _NOT_ENTERED;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("LudoOmnichainTreasury")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice Deposit USDT into the user's on-chain vault
     * @param amount USDT amount in raw units (e.g. 6 or 18 decimals)
     */
    function depositUsdt(uint256 amount) external nonReentrant {
        require(amount > 0, "Deposit amount must be > 0");
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "USDT transfer failed");

        vaultBalances[msg.sender] += amount;
        emit DepositReceived(msg.sender, amount, vaultBalances[msg.sender]);
    }

    /**
     * @notice Authorizes and enters a player into a match using an EIP-712 cryptographic signature
     * Gas is paid by the backend relayer so the player experiences a 100% gasless match entry
     */
    function joinMatchWithSignature(
        address player,
        string calldata matchId,
        uint256 entryFee,
        uint256 deadline,
        bytes calldata signature
    ) external onlyRelayerOrOwner nonReentrant {
        require(block.timestamp <= deadline, "Signature expired");
        require(signature.length == 65, "Invalid signature length");

        // Verify EIP-712 Signature
        bytes32 structHash = keccak256(
            abi.encode(
                JOIN_MATCH_TYPEHASH,
                player,
                keccak256(bytes(matchId)),
                entryFee,
                nonces[player]++,
                deadline
            )
        );

        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address signer = recoverSigner(hash, signature);
        require(signer == player, "Invalid EIP-712 signer");

        // Deduct entry fee from player vault balance
        require(vaultBalances[player] >= entryFee, "Insufficient player vault balance");
        vaultBalances[player] -= entryFee;

        // Add player to match escrow
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.players.length == 0) {
            escrow.matchId = matchId;
            escrow.entryFee = entryFee;
            emit MatchCreated(matchId, entryFee);
        }

        escrow.players.push(player);
        escrow.totalEscrowed += entryFee;

        emit PlayerJoinedMatch(matchId, player, entryFee);
    }

    /**
     * @notice Authoritatively settles a match on-chain
     * Distributes winner payout to winner's vault (or address) and platform rake to Treasury
     */
    function settleMatch(
        string calldata matchId,
        address winner,
        uint256 winnerPayout,
        uint256 platformRake
    ) external onlyRelayerOrOwner nonReentrant {
        MatchEscrow storage escrow = matchEscrows[matchId];
        require(!escrow.isSettled, "Match already settled");
        require(!escrow.isCancelled, "Match is cancelled");
        require(escrow.totalEscrowed >= (winnerPayout + platformRake), "Invalid payout calculation");

        escrow.isSettled = true;
        escrow.winner = winner;
        escrow.winnerPayout = winnerPayout;
        escrow.platformRake = platformRake;

        // Credit winner's in-contract balance
        vaultBalances[winner] += winnerPayout;

        // Transfer platform rake to Treasury wallet
        if (platformRake > 0) {
            require(usdtToken.transfer(treasuryWallet, platformRake), "Treasury rake transfer failed");
        }

        emit MatchSettled(matchId, winner, winnerPayout, platformRake, block.timestamp);
    }

    /**
     * @notice Cancels a match and refunds all escrowed entry fees to players' vaults
     */
    function cancelMatchAndRefund(string calldata matchId) external onlyRelayerOrOwner nonReentrant {
        MatchEscrow storage escrow = matchEscrows[matchId];
        require(!escrow.isSettled, "Cannot refund settled match");
        require(!escrow.isCancelled, "Already cancelled");

        escrow.isCancelled = true;
        uint256 refundPerPlayer = escrow.entryFee;

        for (uint256 i = 0; i < escrow.players.length; i++) {
            address player = escrow.players[i];
            vaultBalances[player] += refundPerPlayer;
        }

        emit MatchRefunded(matchId, refundPerPlayer);
    }

    /**
     * @notice Direct withdrawal execution from user vault
     * @param recipient Player destination wallet
     * @param grossAmount Total requested USDT
     * @param totalFeesDeducted Total (Gas + Platform + CrossChain) fee deducted in USDT
     * @param destinationChain Identifier of destination chain
     */
    function executeWithdrawal(
        address recipient,
        uint256 grossAmount,
        uint256 totalFeesDeducted,
        string calldata destinationChain
    ) external onlyRelayerOrOwner nonReentrant {
        require(grossAmount > totalFeesDeducted, "Fees exceed withdrawal amount");
        uint256 netAmount = grossAmount - totalFeesDeducted;

        // Send net amount to recipient
        require(usdtToken.transfer(recipient, netAmount), "Net USDT transfer failed");

        // Send collected fees to platform treasury
        if (totalFeesDeducted > 0) {
            require(usdtToken.transfer(treasuryWallet, totalFeesDeducted), "Fee transfer failed");
        }

        emit WithdrawalDispatched(recipient, grossAmount, netAmount, totalFeesDeducted, destinationChain);
    }

    /**
     * @dev Recover signer from signature bytes
     */
    function recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        return ecrecover(messageHash, v, r, s);
    }

    // Admin updates
    function setTreasuryWallet(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid address");
        emit TreasuryUpdated(treasuryWallet, _newTreasury);
        treasuryWallet = _newTreasury;
    }

    function setRelayerOracle(address _newRelayer) external onlyOwner {
        require(_newRelayer != address(0), "Invalid address");
        emit RelayerUpdated(relayerOracle, _newRelayer);
        relayerOracle = _newRelayer;
    }

    /**
     * @notice Emergency recovery in case non-USDT tokens are accidentally sent to contract
     */
    function rescueTokens(address tokenAddress, uint256 amount, address to) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC20(tokenAddress).transfer(to, amount);
    }
}
