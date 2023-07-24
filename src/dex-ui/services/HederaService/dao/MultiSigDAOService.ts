import { BigNumber } from "bignumber.js";
import { HashConnectSigner } from "hashconnect/dist/esm/provider/signer";
import {
  AccountId,
  ContractId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TransactionResponse,
  TokenId,
} from "@hashgraph/sdk";
import { BaseDAOContractFunctions, MultiSigDAOContractFunctions } from "./type";
import { checkTransactionResponseForError } from "../utils";
import { Contracts } from "../../constants";
import { ethers } from "ethers";
import MultiSigDAOFactoryJSON from "../../abi/MultiSigDAOFactory.json";

const Gas = 9000000;

interface SendCreateMultiSigDAOTransactionParams {
  admin: string;
  name: string;
  logoUrl: string;
  owners: string[];
  description: string;
  daoLinks: string[];
  threshold: number;
  isPrivate: boolean;
  signer: HashConnectSigner;
}

async function sendCreateMultiSigDAOTransaction(
  params: SendCreateMultiSigDAOTransactionParams
): Promise<TransactionResponse> {
  const { admin, name, logoUrl, owners, threshold, isPrivate, signer, description, daoLinks } = params;
  const multiSigDAOFactoryContractId = ContractId.fromString(Contracts.MultiSigDAOFactory.ProxyId);
  const daoAdminAddress = AccountId.fromString(admin).toSolidityAddress();
  const preciseThreshold = BigNumber(threshold);
  const ownersSolidityAddresses = owners.map((owner) => AccountId.fromString(owner).toSolidityAddress());
  const createDaoParams: any[] = [
    daoAdminAddress,
    name,
    logoUrl,
    ownersSolidityAddresses,
    preciseThreshold.toNumber(),
    isPrivate,
    description,
    daoLinks,
  ];
  const contractInterface = new ethers.utils.Interface(MultiSigDAOFactoryJSON.abi);
  const data = contractInterface.encodeFunctionData(BaseDAOContractFunctions.CreateDAO, [createDaoParams]);
  const createMultiSigDAOTransaction = await new ContractExecuteTransaction()
    .setContractId(multiSigDAOFactoryContractId)
    .setFunctionParameters(ethers.utils.arrayify(data))
    .setGas(Gas)
    .freezeWithSigner(signer);
  const createMultiSigDAOResponse = await createMultiSigDAOTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(createMultiSigDAOResponse, BaseDAOContractFunctions.CreateDAO);
  return createMultiSigDAOResponse;
}
interface SendProposeTransaction {
  safeEVMAddress: string;
  data: string;
  multiSigDAOContractId: string;
  title: string;
  description: string;
  linkToDiscussion?: string;
  transactionType: number;
  hBarPayableValue?: number;
  signer: HashConnectSigner;
}

async function sendProposeTransaction(params: SendProposeTransaction) {
  const {
    safeEVMAddress,
    data,
    signer,
    multiSigDAOContractId,
    transactionType,
    title,
    description,
    hBarPayableValue,
    linkToDiscussion = "",
  } = params;
  const hBarAmount = hBarPayableValue ? hBarPayableValue : 0;
  const ownerData = ethers.utils.arrayify(data);
  const contractFunctionParameters = new ContractFunctionParameters()
    .addAddress(safeEVMAddress)
    .addBytes(ownerData)
    .addUint256(transactionType)
    .addString(title)
    .addString(description)
    .addString(linkToDiscussion);
  const sendProposeTransaction = await new ContractExecuteTransaction()
    .setContractId(multiSigDAOContractId)
    .setFunction(MultiSigDAOContractFunctions.ProposeTransaction, contractFunctionParameters)
    .setGas(Gas)
    .setPayableAmount(hBarAmount)
    .freezeWithSigner(signer);
  const sendProposeTransactionResponse = await sendProposeTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(sendProposeTransactionResponse, MultiSigDAOContractFunctions.ProposeTransaction);
  return sendProposeTransactionResponse;
}

interface UpdateDAODetailsTransactionParams {
  name: string;
  description: string;
  logoUrl: string;
  webLinks: string[];
  daoAccountId: string;
  signer: HashConnectSigner;
}

async function sendUpdateDAODetailsTransaction(params: UpdateDAODetailsTransactionParams) {
  const { name, description, logoUrl, webLinks, daoAccountId, signer } = params;
  const contractFunctionParameters = new ContractFunctionParameters()
    .addString(name)
    .addString(logoUrl)
    .addString(description)
    .addStringArray(webLinks);
  const sendProposeUpdateDAODetailsTransaction = await new ContractExecuteTransaction()
    .setContractId(daoAccountId)
    .setFunction(MultiSigDAOContractFunctions.UpdateDAOInfo, contractFunctionParameters)
    .setGas(Gas)
    .freezeWithSigner(signer);
  const sendProposeUpdateDAODetailsResponse = await sendProposeUpdateDAODetailsTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(sendProposeUpdateDAODetailsResponse, MultiSigDAOContractFunctions.UpdateDAOInfo);
  return sendProposeUpdateDAODetailsResponse;
}

interface TokenAssociateTransactionParams {
  title: string;
  description: string;
  linkToDiscussion: string;
  tokenId: string;
  daoAccountId: string;
  signer: HashConnectSigner;
}

async function sendDAOTokenAssociateTransaction(params: TokenAssociateTransactionParams) {
  const { title, description, linkToDiscussion, tokenId, daoAccountId, signer } = params;
  const tokenSolidityAddress = TokenId.fromString(tokenId).toSolidityAddress();
  const contractFunctionParameters = new ContractFunctionParameters()
    .addAddress(tokenSolidityAddress)
    .addString(title)
    .addString(description)
    .addString(linkToDiscussion);
  const sendProposeTokenAssociationTransaction = await new ContractExecuteTransaction()
    .setContractId(daoAccountId)
    .setFunction(MultiSigDAOContractFunctions.ProposeTokenAssociation, contractFunctionParameters)
    .setGas(Gas)
    .freezeWithSigner(signer);
  const sendProposeTokenAssociationResponse = await sendProposeTokenAssociationTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(
    sendProposeTokenAssociationResponse,
    MultiSigDAOContractFunctions.ProposeTokenAssociation
  );
  return sendProposeTokenAssociationResponse;
}

export {
  sendCreateMultiSigDAOTransaction,
  sendProposeTransaction,
  sendUpdateDAODetailsTransaction,
  sendDAOTokenAssociateTransaction,
};
