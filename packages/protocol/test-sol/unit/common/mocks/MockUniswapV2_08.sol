// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.7 <0.8.20;

// ============================================================
//  Uniswap V2 mocks ported to Solidity 0.8 for Foundry tests.
//  Original 0.5 sources are in contracts/uniswap/test/.
// ============================================================

// ---------------------------------------------------------------------------
// Minimal interfaces (trimmed to what the mocks and tests actually use)
// ---------------------------------------------------------------------------

interface IUniswapV2Pair08 {
  function initialize(address, address) external;
  function mint(address to) external returns (uint256 liquidity);
  function burn(address to) external returns (uint256 amount0, uint256 amount1);
  function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
  function skim(address to) external;
  function sync() external;
  function getReserves()
    external
    view
    returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
  function transferFrom(address from, address to, uint256 value) external returns (bool);
  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
  function factory() external view returns (address);
  function token0() external view returns (address);
  function token1() external view returns (address);
}

interface IUniswapV2Factory08 {
  function feeTo() external view returns (address);
  function getPair(address tokenA, address tokenB) external view returns (address pair);
  function createPair(address tokenA, address tokenB) external returns (address pair);
  function INIT_CODE_PAIR_HASH() external view returns (bytes32);
}

interface IUniswapV2Callee08 {
  function uniswapV2Call(
    address sender,
    uint256 amount0,
    uint256 amount1,
    bytes calldata data
  ) external;
}

interface IERC20Uni {
  function balanceOf(address owner) external view returns (uint256);
  function transfer(address to, uint256 value) external returns (bool);
  function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// ---------------------------------------------------------------------------
// MathUni08
// ---------------------------------------------------------------------------

library MathUni08 {
  function min(uint256 x, uint256 y) internal pure returns (uint256 z) {
    z = x < y ? x : y;
  }

  // babylonian method
  function sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
      z = y;
      uint256 x = y / 2 + 1;
      while (x < z) {
        z = x;
        x = (y / x + x) / 2;
      }
    } else if (y != 0) {
      z = 1;
    }
  }
}

// ---------------------------------------------------------------------------
// UQ112x112_08
// ---------------------------------------------------------------------------

library UQ112x112_08 {
  uint224 constant Q112 = 2 ** 112;

  function encode(uint112 y) internal pure returns (uint224 z) {
    z = uint224(y) * Q112; // never overflows
  }

  function uqdiv(uint224 x, uint112 y) internal pure returns (uint224 z) {
    z = x / uint224(y);
  }
}

// ---------------------------------------------------------------------------
// TransferHelper08
// ---------------------------------------------------------------------------

library TransferHelper08 {
  function safeApprove(address token, address to, uint256 value) internal {
    (bool success, bytes memory data) = token.call(
      abi.encodeWithSelector(0x095ea7b3, to, value)
    );
    require(
      success && (data.length == 0 || abi.decode(data, (bool))),
      "TransferHelper::safeApprove: approve failed"
    );
  }

  function safeTransfer(address token, address to, uint256 value) internal {
    (bool success, bytes memory data) = token.call(
      abi.encodeWithSelector(0xa9059cbb, to, value)
    );
    require(
      success && (data.length == 0 || abi.decode(data, (bool))),
      "TransferHelper::safeTransfer: transfer failed"
    );
  }

  function safeTransferFrom(address token, address from, address to, uint256 value) internal {
    (bool success, bytes memory data) = token.call(
      abi.encodeWithSelector(0x23b872dd, from, to, value)
    );
    require(
      success && (data.length == 0 || abi.decode(data, (bool))),
      "TransferHelper::transferFrom: transferFrom failed"
    );
  }

  function safeTransferETH(address to, uint256 value) internal {
    // no-op stub matching 0.5 mock behaviour
    (to, value);
  }
}

// ---------------------------------------------------------------------------
// UniswapV2Library08
// ---------------------------------------------------------------------------

library UniswapV2Library08 {
  // returns sorted token addresses
  function sortTokens(
    address tokenA,
    address tokenB
  ) internal pure returns (address token0, address token1) {
    require(tokenA != tokenB, "UniswapV2Library: IDENTICAL_ADDRESSES");
    (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), "UniswapV2Library: ZERO_ADDRESS");
  }

  // calculates the CREATE2 address for a pair without external calls.
  // initCodePairHash is passed in (NOT hardcoded) so the router always stays
  // consistent with whichever factory + pair combination is deployed.
  function pairFor(
    address factory,
    address tokenA,
    address tokenB,
    bytes32 initCodePairHash
  ) internal pure returns (address pair) {
    (address token0, address token1) = sortTokens(tokenA, tokenB);
    pair = address(
      uint160(
        uint256(
          keccak256(
            abi.encodePacked(
              hex"ff",
              factory,
              keccak256(abi.encodePacked(token0, token1)),
              initCodePairHash
            )
          )
        )
      )
    );
  }

  function getReserves(
    address factory,
    address tokenA,
    address tokenB,
    bytes32 initCodePairHash
  ) internal view returns (uint256 reserveA, uint256 reserveB) {
    (address token0, ) = sortTokens(tokenA, tokenB);
    (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair08(
      pairFor(factory, tokenA, tokenB, initCodePairHash)
    ).getReserves();
    (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
  }

  function quote(
    uint256 amountA,
    uint256 reserveA,
    uint256 reserveB
  ) internal pure returns (uint256 amountB) {
    require(amountA > 0, "UniswapV2Library: INSUFFICIENT_AMOUNT");
    require(reserveA > 0 && reserveB > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");
    amountB = (amountA * reserveB) / reserveA;
  }

  function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
  ) internal pure returns (uint256 amountOut) {
    require(amountIn > 0, "UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT");
    require(reserveIn > 0 && reserveOut > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");
    uint256 amountInWithFee = amountIn * 997;
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = reserveIn * 1000 + amountInWithFee;
    amountOut = numerator / denominator;
  }

  function getAmountIn(
    uint256 amountOut,
    uint256 reserveIn,
    uint256 reserveOut
  ) internal pure returns (uint256 amountIn) {
    require(amountOut > 0, "UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT");
    require(reserveIn > 0 && reserveOut > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");
    uint256 numerator = reserveIn * amountOut * 1000;
    uint256 denominator = (reserveOut - amountOut) * 997;
    amountIn = (numerator / denominator) + 1;
  }

  function getAmountsOut(
    address factory,
    uint256 amountIn,
    address[] memory path,
    bytes32 initCodePairHash
  ) internal view returns (uint256[] memory amounts) {
    require(path.length >= 2, "UniswapV2Library: INVALID_PATH");
    amounts = new uint256[](path.length);
    amounts[0] = amountIn;
    for (uint256 i; i < path.length - 1; i++) {
      (uint256 reserveIn, uint256 reserveOut) = getReserves(
        factory,
        path[i],
        path[i + 1],
        initCodePairHash
      );
      amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
    }
  }

  function getAmountsIn(
    address factory,
    uint256 amountOut,
    address[] memory path,
    bytes32 initCodePairHash
  ) internal view returns (uint256[] memory amounts) {
    require(path.length >= 2, "UniswapV2Library: INVALID_PATH");
    amounts = new uint256[](path.length);
    amounts[amounts.length - 1] = amountOut;
    for (uint256 i = path.length - 1; i > 0; i--) {
      (uint256 reserveIn, uint256 reserveOut) = getReserves(
        factory,
        path[i - 1],
        path[i],
        initCodePairHash
      );
      amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
    }
  }
}

// ---------------------------------------------------------------------------
// UniswapV2ERC20_08  (LP token base)
// ---------------------------------------------------------------------------

contract UniswapV2ERC20_08 {
  string public constant name = "Uniswap V2";
  string public constant symbol = "UNI-V2";
  uint8 public constant decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  bytes32 public DOMAIN_SEPARATOR;
  bytes32 public constant PERMIT_TYPEHASH =
    0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
  mapping(address => uint256) public nonces;

  event Approval(address indexed owner, address indexed spender, uint256 value);
  event Transfer(address indexed from, address indexed to, uint256 value);

  constructor() {
    uint256 chainId;
    assembly {
      chainId := chainid()
    }
    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes(name)),
        keccak256(bytes("1")),
        chainId,
        address(this)
      )
    );
  }

  function approve(address spender, uint256 value) external returns (bool) {
    _approve(msg.sender, spender, value);
    return true;
  }

  function transfer(address to, uint256 value) external returns (bool) {
    _transfer(msg.sender, to, value);
    return true;
  }

  function transferFrom(address from, address to, uint256 value) external returns (bool) {
    if (allowance[from][msg.sender] != type(uint256).max) {
      allowance[from][msg.sender] -= value;
    }
    _transfer(from, to, value);
    return true;
  }

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    require(deadline >= block.timestamp, "UniswapV2: EXPIRED");
    bytes32 digest = keccak256(
      abi.encodePacked(
        "\x19\x01",
        DOMAIN_SEPARATOR,
        keccak256(
          abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline)
        )
      )
    );
    address recoveredAddress = ecrecover(digest, v, r, s);
    require(
      recoveredAddress != address(0) && recoveredAddress == owner,
      "UniswapV2: INVALID_SIGNATURE"
    );
    _approve(owner, spender, value);
  }

  function _mint(address to, uint256 value) internal {
    totalSupply += value;
    balanceOf[to] += value;
    emit Transfer(address(0), to, value);
  }

  function _burn(address from, uint256 value) internal {
    balanceOf[from] -= value;
    totalSupply -= value;
    emit Transfer(from, address(0), value);
  }

  function _approve(address owner, address spender, uint256 value) private {
    allowance[owner][spender] = value;
    emit Approval(owner, spender, value);
  }

  function _transfer(address from, address to, uint256 value) private {
    balanceOf[from] -= value;
    balanceOf[to] += value;
    emit Transfer(from, to, value);
  }
}

// ---------------------------------------------------------------------------
// MockUniswapV2Pair08
// ---------------------------------------------------------------------------

contract MockUniswapV2Pair08 is UniswapV2ERC20_08 {
  using UQ112x112_08 for uint224;

  uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;
  bytes4 private constant SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

  address public factory;
  address public token0;
  address public token1;

  uint112 private reserve0;
  uint112 private reserve1;
  uint32 private blockTimestampLast;

  uint256 public price0CumulativeLast;
  uint256 public price1CumulativeLast;
  uint256 public kLast;

  uint256 private unlocked = 1;

  event Mint(address indexed sender, uint256 amount0, uint256 amount1);
  event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
  event Swap(
    address indexed sender,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out,
    address indexed to
  );
  event Sync(uint112 reserve0, uint112 reserve1);

  modifier lock() {
    require(unlocked == 1, "UniswapV2: LOCKED");
    unlocked = 0;
    _;
    unlocked = 1;
  }

  constructor() {
    factory = msg.sender;
  }

  function initialize(address _token0, address _token1) external {
    require(msg.sender == factory, "UniswapV2: FORBIDDEN");
    token0 = _token0;
    token1 = _token1;
  }

  function getReserves()
    public
    view
    returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)
  {
    _reserve0 = reserve0;
    _reserve1 = reserve1;
    _blockTimestampLast = blockTimestampLast;
  }

  function mint(address to) external lock returns (uint256 liquidity) {
    (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
    uint256 balance0 = IERC20Uni(token0).balanceOf(address(this));
    uint256 balance1 = IERC20Uni(token1).balanceOf(address(this));
    uint256 amount0 = balance0 - _reserve0;
    uint256 amount1 = balance1 - _reserve1;

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint256 _totalSupply = totalSupply;
    if (_totalSupply == 0) {
      liquidity = MathUni08.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
      _mint(address(0), MINIMUM_LIQUIDITY);
    } else {
      liquidity = MathUni08.min(
        (amount0 * _totalSupply) / _reserve0,
        (amount1 * _totalSupply) / _reserve1
      );
    }
    require(liquidity > 0, "UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED");
    _mint(to, liquidity);

    _update(balance0, balance1, _reserve0, _reserve1);
    if (feeOn) kLast = uint256(reserve0) * reserve1;
    emit Mint(msg.sender, amount0, amount1);
  }

  function burn(address to) external lock returns (uint256 amount0, uint256 amount1) {
    (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
    address _token0 = token0;
    address _token1 = token1;
    uint256 balance0 = IERC20Uni(_token0).balanceOf(address(this));
    uint256 balance1 = IERC20Uni(_token1).balanceOf(address(this));
    uint256 liquidity = balanceOf[address(this)];

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint256 _totalSupply = totalSupply;
    amount0 = (liquidity * balance0) / _totalSupply;
    amount1 = (liquidity * balance1) / _totalSupply;
    require(amount0 > 0 && amount1 > 0, "UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED");
    _burn(address(this), liquidity);
    _safeTransfer(_token0, to, amount0);
    _safeTransfer(_token1, to, amount1);
    balance0 = IERC20Uni(_token0).balanceOf(address(this));
    balance1 = IERC20Uni(_token1).balanceOf(address(this));

    _update(balance0, balance1, _reserve0, _reserve1);
    if (feeOn) kLast = uint256(reserve0) * reserve1;
    emit Burn(msg.sender, amount0, amount1, to);
  }

  function swap(
    uint256 amount0Out,
    uint256 amount1Out,
    address to,
    bytes calldata data
  ) external lock {
    require(amount0Out > 0 || amount1Out > 0, "UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT");
    (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
    require(amount0Out < _reserve0 && amount1Out < _reserve1, "UniswapV2: INSUFFICIENT_LIQUIDITY");

    uint256 balance0;
    uint256 balance1;
    {
      address _token0 = token0;
      address _token1 = token1;
      require(to != _token0 && to != _token1, "UniswapV2: INVALID_TO");
      if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out);
      if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out);
      if (data.length > 0)
        IUniswapV2Callee08(to).uniswapV2Call(msg.sender, amount0Out, amount1Out, data);
      balance0 = IERC20Uni(_token0).balanceOf(address(this));
      balance1 = IERC20Uni(_token1).balanceOf(address(this));
    }
    uint256 amount0In = balance0 > _reserve0 - amount0Out
      ? balance0 - (_reserve0 - amount0Out)
      : 0;
    uint256 amount1In = balance1 > _reserve1 - amount1Out
      ? balance1 - (_reserve1 - amount1Out)
      : 0;
    require(amount0In > 0 || amount1In > 0, "UniswapV2: INSUFFICIENT_INPUT_AMOUNT");
    {
      uint256 balance0Adjusted = balance0 * 1000 - amount0In * 3;
      uint256 balance1Adjusted = balance1 * 1000 - amount1In * 3;
      require(
        balance0Adjusted * balance1Adjusted >= uint256(_reserve0) * uint256(_reserve1) * (1000 ** 2),
        "UniswapV2: K"
      );
    }

    _update(balance0, balance1, _reserve0, _reserve1);
    emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
  }

  function skim(address to) external lock {
    address _token0 = token0;
    address _token1 = token1;
    _safeTransfer(_token0, to, IERC20Uni(_token0).balanceOf(address(this)) - reserve0);
    _safeTransfer(_token1, to, IERC20Uni(_token1).balanceOf(address(this)) - reserve1);
  }

  function sync() external lock {
    _update(
      IERC20Uni(token0).balanceOf(address(this)),
      IERC20Uni(token1).balanceOf(address(this)),
      reserve0,
      reserve1
    );
  }

  function _safeTransfer(address token, address to, uint256 value) private {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
    require(
      success && (data.length == 0 || abi.decode(data, (bool))),
      "UniswapV2: TRANSFER_FAILED"
    );
  }

  function _update(
    uint256 balance0,
    uint256 balance1,
    uint112 _reserve0,
    uint112 _reserve1
  ) private {
    require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "UniswapV2: OVERFLOW");
    // The timestamp and price accumulators use intentional wrapping arithmetic.
    unchecked {
      uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
      uint32 timeElapsed = blockTimestamp - blockTimestampLast;
      if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
        price0CumulativeLast +=
          uint256(UQ112x112_08.encode(_reserve1).uqdiv(_reserve0)) *
          timeElapsed;
        price1CumulativeLast +=
          uint256(UQ112x112_08.encode(_reserve0).uqdiv(_reserve1)) *
          timeElapsed;
      }
      reserve0 = uint112(balance0);
      reserve1 = uint112(balance1);
      blockTimestampLast = blockTimestamp;
    }
    emit Sync(reserve0, reserve1);
  }

  function _mintFee(uint112 _reserve0, uint112 _reserve1) private returns (bool feeOn) {
    address feeTo = IUniswapV2Factory08(factory).feeTo();
    feeOn = feeTo != address(0);
    uint256 _kLast = kLast;
    if (feeOn) {
      if (_kLast != 0) {
        uint256 rootK = MathUni08.sqrt(uint256(_reserve0) * uint256(_reserve1));
        uint256 rootKLast = MathUni08.sqrt(_kLast);
        if (rootK > rootKLast) {
          uint256 numerator = totalSupply * (rootK - rootKLast);
          uint256 denominator = rootK * 5 + rootKLast;
          uint256 liquidity = numerator / denominator;
          if (liquidity > 0) _mint(feeTo, liquidity);
        }
      }
    } else if (_kLast != 0) {
      kLast = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// MockUniswapV2Factory08
// ---------------------------------------------------------------------------

contract MockUniswapV2Factory08 is IUniswapV2Factory08 {
  address public feeTo;
  address public feeToSetter;

  mapping(address => mapping(address => address)) public getPair;
  address[] public allPairs;

  bytes32 public constant INIT_CODE_PAIR_HASH =
    keccak256(abi.encodePacked(type(MockUniswapV2Pair08).creationCode));

  event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

  constructor(address _feeToSetter) {
    feeToSetter = _feeToSetter;
  }

  function createPair(address tokenA, address tokenB) external returns (address pair) {
    require(tokenA != tokenB, "UniswapV2: IDENTICAL_ADDRESSES");
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), "UniswapV2: ZERO_ADDRESS");
    require(getPair[token0][token1] == address(0), "UniswapV2: PAIR_EXISTS");
    bytes memory bytecode = type(MockUniswapV2Pair08).creationCode;
    bytes32 salt = keccak256(abi.encodePacked(token0, token1));
    assembly {
      pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }
    IUniswapV2Pair08(pair).initialize(token0, token1);
    getPair[token0][token1] = pair;
    getPair[token1][token0] = pair;
    allPairs.push(pair);
    emit PairCreated(token0, token1, pair, allPairs.length);
  }

  function setFeeTo(address _feeTo) external {
    require(msg.sender == feeToSetter, "UniswapV2: FORBIDDEN");
    feeTo = _feeTo;
  }

  function setFeeToSetter(address _feeToSetter) external {
    require(msg.sender == feeToSetter, "UniswapV2: FORBIDDEN");
    feeToSetter = _feeToSetter;
  }

  function allPairsLength() external view returns (uint256) {
    return allPairs.length;
  }
}

// ---------------------------------------------------------------------------
// MockUniswapV2Router0208
// ---------------------------------------------------------------------------

contract MockUniswapV2Router0208 {
  address public factory;
  address public WETH;
  bytes32 public INIT_CODE_PAIR_HASH;

  modifier ensure(uint256 deadline) {
    require(deadline >= block.timestamp, "UniswapV2Router: EXPIRED");
    _;
  }

  constructor(address _factory, address _WETH, bytes32 initCodePairHash) {
    factory = _factory;
    WETH = _WETH;
    INIT_CODE_PAIR_HASH = initCodePairHash;
  }

  // **** ADD LIQUIDITY ****

  function _addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin
  ) internal returns (uint256 amountA, uint256 amountB) {
    if (IUniswapV2Factory08(factory).getPair(tokenA, tokenB) == address(0)) {
      IUniswapV2Factory08(factory).createPair(tokenA, tokenB);
    }
    (uint256 reserveA, uint256 reserveB) = UniswapV2Library08.getReserves(
      factory,
      tokenA,
      tokenB,
      INIT_CODE_PAIR_HASH
    );
    if (reserveA == 0 && reserveB == 0) {
      (amountA, amountB) = (amountADesired, amountBDesired);
    } else {
      uint256 amountBOptimal = UniswapV2Library08.quote(amountADesired, reserveA, reserveB);
      if (amountBOptimal <= amountBDesired) {
        require(amountBOptimal >= amountBMin, "UniswapV2Router: INSUFFICIENT_B_AMOUNT");
        (amountA, amountB) = (amountADesired, amountBOptimal);
      } else {
        uint256 amountAOptimal = UniswapV2Library08.quote(amountBDesired, reserveB, reserveA);
        assert(amountAOptimal <= amountADesired);
        require(amountAOptimal >= amountAMin, "UniswapV2Router: INSUFFICIENT_A_AMOUNT");
        (amountA, amountB) = (amountAOptimal, amountBDesired);
      }
    }
  }

  function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
  ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
    (amountA, amountB) = _addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin
    );
    address pair = UniswapV2Library08.pairFor(factory, tokenA, tokenB, INIT_CODE_PAIR_HASH);
    TransferHelper08.safeTransferFrom(tokenA, msg.sender, pair, amountA);
    TransferHelper08.safeTransferFrom(tokenB, msg.sender, pair, amountB);
    liquidity = IUniswapV2Pair08(pair).mint(to);
  }

  // **** REMOVE LIQUIDITY ****

  function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
  ) public ensure(deadline) returns (uint256 amountA, uint256 amountB) {
    address pair = UniswapV2Library08.pairFor(factory, tokenA, tokenB, INIT_CODE_PAIR_HASH);
    IUniswapV2Pair08(pair).transferFrom(msg.sender, pair, liquidity);
    (uint256 amount0, uint256 amount1) = IUniswapV2Pair08(pair).burn(to);
    (address token0, ) = UniswapV2Library08.sortTokens(tokenA, tokenB);
    (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
    require(amountA >= amountAMin, "UniswapV2Router: INSUFFICIENT_A_AMOUNT");
    require(amountB >= amountBMin, "UniswapV2Router: INSUFFICIENT_B_AMOUNT");
  }

  // **** SWAP ****

  function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
    for (uint256 i; i < path.length - 1; i++) {
      (address input, address output) = (path[i], path[i + 1]);
      (address token0, ) = UniswapV2Library08.sortTokens(input, output);
      uint256 amountOut = amounts[i + 1];
      (uint256 amount0Out, uint256 amount1Out) = input == token0
        ? (uint256(0), amountOut)
        : (amountOut, uint256(0));
      address to = i < path.length - 2
        ? UniswapV2Library08.pairFor(factory, output, path[i + 2], INIT_CODE_PAIR_HASH)
        : _to;
      IUniswapV2Pair08(
        UniswapV2Library08.pairFor(factory, input, output, INIT_CODE_PAIR_HASH)
      ).swap(amount0Out, amount1Out, to, new bytes(0));
    }
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external ensure(deadline) returns (uint256[] memory amounts) {
    amounts = UniswapV2Library08.getAmountsOut(factory, amountIn, path, INIT_CODE_PAIR_HASH);
    require(
      amounts[amounts.length - 1] >= amountOutMin,
      "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
    );
    TransferHelper08.safeTransferFrom(
      path[0],
      msg.sender,
      UniswapV2Library08.pairFor(factory, path[0], path[1], INIT_CODE_PAIR_HASH),
      amounts[0]
    );
    _swap(amounts, path, to);
  }

  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external ensure(deadline) returns (uint256[] memory amounts) {
    amounts = UniswapV2Library08.getAmountsIn(factory, amountOut, path, INIT_CODE_PAIR_HASH);
    require(amounts[0] <= amountInMax, "UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
    TransferHelper08.safeTransferFrom(
      path[0],
      msg.sender,
      UniswapV2Library08.pairFor(factory, path[0], path[1], INIT_CODE_PAIR_HASH),
      amounts[0]
    );
    _swap(amounts, path, to);
  }

  // **** SUPPORTING FEE-ON-TRANSFER ****

  function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal {
    for (uint256 i; i < path.length - 1; i++) {
      (address input, address output) = (path[i], path[i + 1]);
      (address token0, ) = UniswapV2Library08.sortTokens(input, output);
      IUniswapV2Pair08 pair = IUniswapV2Pair08(
        UniswapV2Library08.pairFor(factory, input, output, INIT_CODE_PAIR_HASH)
      );
      uint256 amountInput;
      uint256 amountOutput;
      {
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        (uint256 reserveInput, uint256 reserveOutput) = input == token0
          ? (reserve0, reserve1)
          : (reserve1, reserve0);
        amountInput =
          IERC20Uni(input).balanceOf(address(pair)) -
          reserveInput;
        amountOutput = UniswapV2Library08.getAmountOut(amountInput, reserveInput, reserveOutput);
      }
      (uint256 amount0Out, uint256 amount1Out) = input == token0
        ? (uint256(0), amountOutput)
        : (amountOutput, uint256(0));
      address to = i < path.length - 2
        ? UniswapV2Library08.pairFor(factory, output, path[i + 2], INIT_CODE_PAIR_HASH)
        : _to;
      pair.swap(amount0Out, amount1Out, to, new bytes(0));
    }
  }

  function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external ensure(deadline) {
    TransferHelper08.safeTransferFrom(
      path[0],
      msg.sender,
      UniswapV2Library08.pairFor(factory, path[0], path[1], INIT_CODE_PAIR_HASH),
      amountIn
    );
    uint256 balanceBefore = IERC20Uni(path[path.length - 1]).balanceOf(to);
    _swapSupportingFeeOnTransferTokens(path, to);
    require(
      IERC20Uni(path[path.length - 1]).balanceOf(to) - balanceBefore >= amountOutMin,
      "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
    );
  }

  // **** LIBRARY FUNCTIONS ****

  function quote(
    uint256 amountA,
    uint256 reserveA,
    uint256 reserveB
  ) public pure returns (uint256 amountB) {
    return UniswapV2Library08.quote(amountA, reserveA, reserveB);
  }

  function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
  ) public pure returns (uint256 amountOut) {
    return UniswapV2Library08.getAmountOut(amountIn, reserveIn, reserveOut);
  }

  function getAmountIn(
    uint256 amountOut,
    uint256 reserveIn,
    uint256 reserveOut
  ) public pure returns (uint256 amountIn) {
    return UniswapV2Library08.getAmountIn(amountOut, reserveIn, reserveOut);
  }

  function getAmountsOut(
    uint256 amountIn,
    address[] memory path
  ) public view returns (uint256[] memory amounts) {
    return UniswapV2Library08.getAmountsOut(factory, amountIn, path, INIT_CODE_PAIR_HASH);
  }

  function getAmountsIn(
    uint256 amountOut,
    address[] memory path
  ) public view returns (uint256[] memory amounts) {
    return UniswapV2Library08.getAmountsIn(factory, amountOut, path, INIT_CODE_PAIR_HASH);
  }
}
