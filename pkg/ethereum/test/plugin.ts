// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ava, { TestFn } from 'ava';
import { Web3 } from 'web3';
import { PluginContextTest } from '@slangroom/core';
import {
	erc20decimals,
	erc20name,
	erc20symbol,
	erc20totalSupply,
	ethBalanceAddr,
	ethBalanceAddrs,
	ethBytes,
	ethGasPrice,
	ethNonce,
	EthereumError
} from '@slangroom/ethereum';

// Solidity contract compiled with solc@0.8.20 in ABI and bytecode
/***
* // SPDX-License-Identifier: AGPL-3.0-or-later
* pragma solidity ^0.8.7;
*
* import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
*
* contract ERC20WithDetails is ERC20 {
*     event OwnerSet(address indexed oldOwner, address indexed newOwner);
*
*     event TransferDetails(address indexed from, address indexed to, uint256 amount, bytes details);
*
*     address private owner;
*     uint256 private constant INITIAL_SUPPLY = 1000;
*
*     modifier isOwner() {
*         require(msg.sender == owner, "Caller is not owner");
*         _;
*     }
*     constructor() ERC20("Non movable token", "NMT") {
*         _mint(msg.sender, INITIAL_SUPPLY);
*
*         owner = msg.sender;
*         emit OwnerSet(address(0), owner);
*     }
*
*     function changeOwner(address newOwner) public isOwner {
*         owner = newOwner;
*         emit OwnerSet(owner, newOwner);
*     }
*
*     function getOwner() external view returns (address) {
*         return owner;
*     }
*
*     function transferDetails(address to, uint256 amount, bytes memory details)
*             public returns (bool) {
*         bool result = super.transfer(to, amount);
*         if(result) {
*             emit TransferDetails(msg.sender, to, amount, details);
*         }
*         return result;
*     }
*
*     function transfer(address to, uint256 amount) public
*             virtual override returns (bool) {
*         return transferDetails(to, amount, "");
*     }
*
*     function transferFromDetails(address from, address to, uint256 amount,
*                                  bytes memory details)
*             public returns (bool) {
*         bool result = super.transferFrom(from, to, amount);
*         if(result) {
*             emit TransferDetails(from, to, amount, details);
*         }
*         return result;
*     }
*
*     function transferFrom(address from, address to, uint256 amount)
*             public virtual override returns (bool)  {
*         return transferFromDetails(from, to, amount, "");
*     }
*
*     function newCoins() public isOwner {
*         _mint(msg.sender, INITIAL_SUPPLY);
*     }
* }
*/
const abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnerSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"details","type":"bytes"}],"name":"TransferDetails","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"changeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"newCoins","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"details","type":"bytes"}],"name":"transferDetails","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"details","type":"bytes"}],"name":"transferFromDetails","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}] as const;
const bytecode = "0x608060405234801562000010575f80fd5b506040518060400160405280601181526020017f4e6f6e206d6f7661626c6520746f6b656e0000000000000000000000000000008152506040518060400160405280600381526020017f4e4d54000000000000000000000000000000000000000000000000000000000081525081600390816200008e91906200068a565b508060049081620000a091906200068a565b505050620000b7336103e86200017860201b60201c565b3360055f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff165f73ffffffffffffffffffffffffffffffffffffffff167f342827c97908e5e2f71151c08502a66d44b6f758e3ac2f1de95f02eb95f0a73560405160405180910390a36200089a565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603620001eb575f6040517fec442f05000000000000000000000000000000000000000000000000000000008152600401620001e29190620007b1565b60405180910390fd5b620001fe5f83836200020260201b60201c565b5050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160362000256578060025f828254620002499190620007f9565b9250508190555062000327565b5f805f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905081811015620002e2578381836040517fe450d38c000000000000000000000000000000000000000000000000000000008152600401620002d99392919062000844565b60405180910390fd5b8181035f808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2081905550505b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160362000370578060025f8282540392505081905550620003ba565b805f808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516200041991906200087f565b60405180910390a3505050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f6002820490506001821680620004a257607f821691505b602082108103620004b857620004b76200045d565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026200051c7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620004df565b620005288683620004df565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f620005726200056c620005668462000540565b62000549565b62000540565b9050919050565b5f819050919050565b6200058d8362000552565b620005a56200059c8262000579565b848454620004eb565b825550505050565b5f90565b620005bb620005ad565b620005c881848462000582565b505050565b5b81811015620005ef57620005e35f82620005b1565b600181019050620005ce565b5050565b601f8211156200063e576200060881620004be565b6200061384620004d0565b8101602085101562000623578190505b6200063b6200063285620004d0565b830182620005cd565b50505b505050565b5f82821c905092915050565b5f620006605f198460080262000643565b1980831691505092915050565b5f6200067a83836200064f565b9150826002028217905092915050565b620006958262000426565b67ffffffffffffffff811115620006b157620006b062000430565b5b620006bd82546200048a565b620006ca828285620005f3565b5f60209050601f83116001811462000700575f8415620006eb578287015190505b620006f785826200066d565b86555062000766565b601f1984166200071086620004be565b5f5b82811015620007395784890151825560018201915060208501945060208101905062000712565b8683101562000759578489015162000755601f8916826200064f565b8355505b6001600288020188555050505b505050505050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f62000799826200076e565b9050919050565b620007ab816200078d565b82525050565b5f602082019050620007c65f830184620007a0565b92915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f620008058262000540565b9150620008128362000540565b92508282019050808211156200082d576200082c620007cc565b5b92915050565b6200083e8162000540565b82525050565b5f606082019050620008595f830186620007a0565b62000868602083018562000833565b62000877604083018462000833565b949350505050565b5f602082019050620008945f83018462000833565b92915050565b6115eb80620008a85f395ff3fe608060405234801561000f575f80fd5b50600436106100e8575f3560e01c806370a082311161008a578063a6f9dae111610064578063a6f9dae11461024c578063a9059cbb14610268578063dd62ed3e14610298578063e2b3bb27146102c8576100e8565b806370a08231146101e0578063893d20e81461021057806395d89b411461022e576100e8565b806323b872dd116100c657806323b872dd14610158578063313ce567146101885780633e6d2d70146101a65780634cfc1e47146101d6576100e8565b806306fdde03146100ec578063095ea7b31461010a57806318160ddd1461013a575b5f80fd5b6100f46102f8565b6040516101019190610f57565b60405180910390f35b610124600480360381019061011f9190611015565b610388565b604051610131919061106d565b60405180910390f35b6101426103aa565b60405161014f9190611095565b60405180910390f35b610172600480360381019061016d91906110ae565b6103b3565b60405161017f919061106d565b60405180910390f35b6101906103d7565b60405161019d9190611119565b60405180910390f35b6101c060048036038101906101bb919061125e565b6103df565b6040516101cd919061106d565b60405180910390f35b6101de610466565b005b6101fa60048036038101906101f591906112ca565b610503565b6040516102079190611095565b60405180910390f35b610218610548565b6040516102259190611304565b60405180910390f35b610236610570565b6040516102439190610f57565b60405180910390f35b610266600480360381019061026191906112ca565b610600565b005b610282600480360381019061027d9190611015565b61074d565b60405161028f919061106d565b60405180910390f35b6102b260048036038101906102ad919061131d565b61076f565b6040516102bf9190611095565b60405180910390f35b6102e260048036038101906102dd919061135b565b6107f1565b6040516102ef919061106d565b60405180910390f35b60606003805461030790611408565b80601f016020809104026020016040519081016040528092919081815260200182805461033390611408565b801561037e5780601f106103555761010080835404028352916020019161037e565b820191905f5260205f20905b81548152906001019060200180831161036157829003601f168201915b5050505050905090565b5f8061039261087a565b905061039f818585610881565b600191505092915050565b5f600254905090565b5f6103ce84848460405180602001604052805f8152506107f1565b90509392505050565b5f6012905090565b5f806103eb8585610893565b9050801561045b578473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f60e96f6b1c834ea90e346f9e9e49769c10e69f240fb3e55202eeac1db7b44ee5868660405161045292919061148a565b60405180910390a35b809150509392505050565b60055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104f5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104ec90611502565b60405180910390fd5b610501336103e86108b5565b565b5f805f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20549050919050565b5f60055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b60606004805461057f90611408565b80601f01602080910402602001604051908101604052809291908181526020018280546105ab90611408565b80156105f65780601f106105cd576101008083540402835291602001916105f6565b820191905f5260205f20905b8154815290600101906020018083116105d957829003601f168201915b5050505050905090565b60055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461068f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161068690611502565b60405180910390fd5b8060055f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff1660055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f342827c97908e5e2f71151c08502a66d44b6f758e3ac2f1de95f02eb95f0a73560405160405180910390a350565b5f610767838360405180602001604052805f8152506103df565b905092915050565b5f60015f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905092915050565b5f806107fe868686610934565b9050801561086e578473ffffffffffffffffffffffffffffffffffffffff168673ffffffffffffffffffffffffffffffffffffffff167f60e96f6b1c834ea90e346f9e9e49769c10e69f240fb3e55202eeac1db7b44ee5868660405161086592919061148a565b60405180910390a35b80915050949350505050565b5f33905090565b61088e8383836001610962565b505050565b5f8061089d61087a565b90506108aa818585610b31565b600191505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610925575f6040517fec442f0500000000000000000000000000000000000000000000000000000000815260040161091c9190611304565b60405180910390fd5b6109305f8383610c21565b5050565b5f8061093e61087a565b905061094b858285610e3a565b610956858585610b31565b60019150509392505050565b5f73ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16036109d2575f6040517fe602df050000000000000000000000000000000000000000000000000000000081526004016109c99190611304565b60405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610a42575f6040517f94280d62000000000000000000000000000000000000000000000000000000008152600401610a399190611304565b60405180910390fd5b8160015f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20819055508015610b2b578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610b229190611095565b60405180910390a35b50505050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610ba1575f6040517f96c6fd1e000000000000000000000000000000000000000000000000000000008152600401610b989190611304565b60405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610c11575f6040517fec442f05000000000000000000000000000000000000000000000000000000008152600401610c089190611304565b60405180910390fd5b610c1c838383610c21565b505050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610c71578060025f828254610c65919061154d565b92505081905550610d3f565b5f805f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905081811015610cfa578381836040517fe450d38c000000000000000000000000000000000000000000000000000000008152600401610cf193929190611580565b60405180910390fd5b8181035f808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2081905550505b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610d86578060025f8282540392505081905550610dd0565b805f808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610e2d9190611095565b60405180910390a3505050565b5f610e45848461076f565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff811015610ec75781811015610eb8578281836040517ffb8f41b2000000000000000000000000000000000000000000000000000000008152600401610eaf93929190611580565b60405180910390fd5b610ec684848484035f610962565b5b50505050565b5f81519050919050565b5f82825260208201905092915050565b5f5b83811015610f04578082015181840152602081019050610ee9565b5f8484015250505050565b5f601f19601f8301169050919050565b5f610f2982610ecd565b610f338185610ed7565b9350610f43818560208601610ee7565b610f4c81610f0f565b840191505092915050565b5f6020820190508181035f830152610f6f8184610f1f565b905092915050565b5f604051905090565b5f80fd5b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610fb182610f88565b9050919050565b610fc181610fa7565b8114610fcb575f80fd5b50565b5f81359050610fdc81610fb8565b92915050565b5f819050919050565b610ff481610fe2565b8114610ffe575f80fd5b50565b5f8135905061100f81610feb565b92915050565b5f806040838503121561102b5761102a610f80565b5b5f61103885828601610fce565b925050602061104985828601611001565b9150509250929050565b5f8115159050919050565b61106781611053565b82525050565b5f6020820190506110805f83018461105e565b92915050565b61108f81610fe2565b82525050565b5f6020820190506110a85f830184611086565b92915050565b5f805f606084860312156110c5576110c4610f80565b5b5f6110d286828701610fce565b93505060206110e386828701610fce565b92505060406110f486828701611001565b9150509250925092565b5f60ff82169050919050565b611113816110fe565b82525050565b5f60208201905061112c5f83018461110a565b92915050565b5f80fd5b5f80fd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b61117082610f0f565b810181811067ffffffffffffffff8211171561118f5761118e61113a565b5b80604052505050565b5f6111a1610f77565b90506111ad8282611167565b919050565b5f67ffffffffffffffff8211156111cc576111cb61113a565b5b6111d582610f0f565b9050602081019050919050565b828183375f83830152505050565b5f6112026111fd846111b2565b611198565b90508281526020810184848401111561121e5761121d611136565b5b6112298482856111e2565b509392505050565b5f82601f83011261124557611244611132565b5b81356112558482602086016111f0565b91505092915050565b5f805f6060848603121561127557611274610f80565b5b5f61128286828701610fce565b935050602061129386828701611001565b925050604084013567ffffffffffffffff8111156112b4576112b3610f84565b5b6112c086828701611231565b9150509250925092565b5f602082840312156112df576112de610f80565b5b5f6112ec84828501610fce565b91505092915050565b6112fe81610fa7565b82525050565b5f6020820190506113175f8301846112f5565b92915050565b5f806040838503121561133357611332610f80565b5b5f61134085828601610fce565b925050602061135185828601610fce565b9150509250929050565b5f805f806080858703121561137357611372610f80565b5b5f61138087828801610fce565b945050602061139187828801610fce565b93505060406113a287828801611001565b925050606085013567ffffffffffffffff8111156113c3576113c2610f84565b5b6113cf87828801611231565b91505092959194509250565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061141f57607f821691505b602082108103611432576114316113db565b5b50919050565b5f81519050919050565b5f82825260208201905092915050565b5f61145c82611438565b6114668185611442565b9350611476818560208601610ee7565b61147f81610f0f565b840191505092915050565b5f60408201905061149d5f830185611086565b81810360208301526114af8184611452565b90509392505050565b7f43616c6c6572206973206e6f74206f776e6572000000000000000000000000005f82015250565b5f6114ec601383610ed7565b91506114f7826114b8565b602082019050919050565b5f6020820190508181035f830152611519816114e0565b9050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f61155782610fe2565b915061156283610fe2565b925082820190508082111561157a57611579611520565b5b92915050565b5f6060820190506115935f8301866112f5565b6115a06020830185611086565b6115ad6040830184611086565b94935050505056fea2646970667358221220c8564fdcf2dea30b9f49a6f1e3a19f8888d28a4d53269df0630a37c2d665068d64736f6c63430008140033";

const test = ava as TestFn<{ web3: Web3 }>;

let erc20Address: string;

test.before(async () => {
	// Deploy the smart contract
	const web3 = new Web3('http://localhost:9485');
	const contract = new web3.eth.Contract(abi);
	const instance = await contract.deploy({
		data: bytecode,
		arguments: [],
	}).send({
		from: '0xc32510251F77382bb9214144D2c488408Ec2047C',
		gas: '3000000'
	});
	erc20Address = instance.options.address!;
})

test('read the ethereum nonce', async (t) => {
	const ctx = new PluginContextTest('http://localhost:9485', {
		address: '0x2D010920b43aFb54f8d5fB51c9354FbC674b28Fc',
	});
	const res = await ethNonce(ctx);
	t.deepEqual(res, {
		ok: true,
		value: '0',
	});
});

test('Ethereum gas price', async (t) => {
	const ctx = PluginContextTest.connect('http://localhost:9485');
	const res = await ethGasPrice(ctx);
	t.truthy(res.ok);
	if (res.ok) t.is(typeof res.value, 'string');
});

// skipped since ganache in testing env is ephemeral and
// thus there is not a specific txid with data
// Anyway this is tested in e2e.bats
test.skip('Retrieve a zenroom object', async (t) => {
	const poem =
		'000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000674e656c206d657a7a6f2064656c2063616d6d696e206469206e6f7374726120766974610a6d6920726974726f7661692070657220756e612073656c7661206f73637572612c0a6368c3a9206c612064697269747461207669612065726120736d6172726974612e00000000000000000000000000000000000000000000000000';
	const ctx = new PluginContextTest('http://localhost:9485', {
		transaction_id: '0x0467636a2557a1ccdaf10ce17ee74340096c510acfa9181c85756d43a8bed522',
	});
	const res = await ethBytes(ctx);
	t.deepEqual(res, {
		ok: true,
		value: poem,
	});
});

test('Ethereum balance', async (t) => {
	const ctx = new PluginContextTest('http://localhost:9485', {
		address: '0x2D010920b43aFb54f8d5fB51c9354FbC674b28Fc',
	});
	const res = await ethBalanceAddr(ctx);
	t.deepEqual(res, {
		ok: true,
		value: '1000000000000000000000',
	});
});

test('Read the balance of an array of addresses', async (t) => {
	const ctx = new PluginContextTest('http://localhost:9485', {
		addresses: [
			'0xc32510251F77382bb9214144D2c488408Ec2047C',
			'0xFf02577F140557190693cFf549025e66119FEA52',
			'0x4743879F5e9dc3fcE41E30380365441E8D14CCEc',
		],
	});
	const res = await ethBalanceAddrs(ctx);
	t.truthy(res.ok);
	if (res.ok) for (const v of res.value as string[]) t.is(typeof v, 'string');
});

test('erc20 symbol()', async (t) => {
	const ctx = new PluginContextTest('http://localhost:9485', {
		sc: erc20Address,
	});
	const res = await erc20symbol(ctx);
	t.deepEqual(res, {
		ok: true,
		value: 'NMT',
	});
});

test('erc20 name()', async (t) => {
	const ctx = new PluginContextTest('http://localhost:9485', {
		sc: erc20Address,
	});
	const res = await erc20name(ctx);
	t.deepEqual(res, {
		ok: true,
		value: 'Non movable token',
	});
});

test('erc20 totalSupply()', async (t) => {
	const ctx = new PluginContextTest('http://localhost:9485', {
		sc: erc20Address,
	});
	const res = await erc20totalSupply(ctx);
	t.deepEqual(res, {
		ok: true,
		value: '1000',
	});
});

test('erc20 decimals()', async (t) => {
	const ctx = new PluginContextTest('http://localhost:9485', {
		sc: erc20Address,
	});
	const res = await erc20decimals(ctx);
	t.deepEqual(res, {
		ok: true,
		value: '18',
	});
});

test('erc20 with invalid address', async (t) => {
	const sc = '0x720765775bb85EAAa08BB74442F106d3ffA03';
	const ctx = new PluginContextTest('http://localhost:9485', { sc: sc });

	const res = await erc20symbol(ctx);
	t.deepEqual(res, {
		ok: false,
		error: new EthereumError(`sc must be a valid ethereum address: ${sc}`)
	});
});

/*test("Erc20 method with arg", async (t) => {
	const { ast, errors } = astify("read the erc20 balance");
	if (errors) {
		t.fail(errors?.toString());
		return;
	}
	const ctx = new PluginContextTest('http://localhost:9485', {
		sc: "0x720F72765775bb85EAAa08BB74442F106d3ffA03",
		address: "0x7d6df85bDBCe99151c813fd1DDE6BC007c523C27"
	});
	const res = await execute(ctx, 'erc20balance');
	t.deepEqual(res, {
		ok: true,
		value: "100",
	});
})*/

/*test("Erc721 id", async (t) => {
	const ctx = new PluginContextTest('http://test.fabchain.net:8545', {
		transaction_id: "0xd91928b513cd71f8077e7d8a300761a105102f718eef232e2efaa87f13e129b6"
	});
	const res = await execute(ctx, 'erc712id');
	t.deepEqual(res, {
		ok: true,
		value: "NMT",
	});
})*/
/*
test("Erc721 asset", async (t) => {
	const ast = line2Ast("erc721 asset in 'nft_id' for 'address'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc721Asset, address: 'address', nftId: 'nft_id' })
})

test("Erc721 owner", async (t) => {
	const ast = line2Ast("erc721 owner of 'nft_id' for 'address'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc721Owner, address: 'address', nftId: 'nft_id' })
})
*/
