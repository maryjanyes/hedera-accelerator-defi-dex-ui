import { createDexService } from "./DexService";
import { createHederaService } from "./HederaService";
import { createJsonRpcService } from "./JsonRpcService";
import { createMirrorNodeService } from "./MirrorNodeService";
import { createWalletService } from "./WalletService";
export * from "./DexService";
export * from "./WalletService";
export * from "./HederaService";
export * from "./MirrorNodeService";
export * from "./JsonRpcService";
export * from "./constants";
export * from "./utils";

const MirrorNodeService = createMirrorNodeService();
const WalletService = createWalletService();
const HederaService = createHederaService();
const JsonRpcService = createJsonRpcService();
const DexAPIService = createDexService();

const initializeServices = async () => {
  await HederaService.initHederaService();
};

/** Should renamed to dexAPI */
const DexService = {
  /** Should be renamed to DexService */
  ...DexAPIService,
  ...WalletService,
  ...JsonRpcService,
  ...MirrorNodeService,
  ...HederaService,
};

export { initializeServices, DexService };