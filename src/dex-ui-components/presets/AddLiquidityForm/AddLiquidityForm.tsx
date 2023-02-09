import { Text, Button, Flex, Spacer } from "@chakra-ui/react";
import { HashConnectConnectionState } from "hashconnect/dist/esm/types";
import { AccountBalanceJson } from "@hashgraph/sdk";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Notification, MetricLabel, NotficationTypes, SettingsButton, useNotification, Color } from "../..";
import { AddLiquidityFormData, InitialAddLiquidityFormState } from "./constants";
import { FormSettings, useFormSettings } from "../FormSettings";
import { DefiFormLayout } from "../layouts";
import { TokenPair } from "../SwapTokensForm/types";
import { TokenInput } from "../TokenInput";
import { isEmpty, isNil } from "ramda";
import { TokenState } from "../types";
import { usePoolsData, useSwapData } from "../../../dex-ui/hooks";
import { REFRESH_INTERVAL } from "../../../dex-ui/hooks/constants";
import {
  calculatePoolRatio,
  getExchangeRateDisplay,
  getPairedTokenData,
  getPairedTokens,
  getSpotPrice,
  getTokenBalance,
  getTokenExchangeAmount,
  getTokensByUniqueAccountIds,
} from "../utils";
import { InitialTokenState, TransactionDeadline } from "../constants";
import { AddLiquidityState, SendAddLiquidityTransactionParams, UserPool } from "../../../dex-ui/store/poolsSlice";
import { AlertDialog, LoadingDialog } from "../../base";
import { WarningIcon } from "@chakra-ui/icons";
import { TransactionStatus } from "../../../dex-ui/store/appSlice";
import { convertNumberOfMinsToSeconds, DefaultAmount } from "../../../dex-ui/utils";

const DefaultTokenMeta = InitialTokenState.tokenMeta;

interface AddLiquidityFormProps {
  isLoading: boolean;
  pairedAccountBalance: AccountBalanceJson | null;
  tokenPairs: TokenPair[] | null;
  spotPrices: Record<string, number | undefined>;
  userPoolsMetrics: UserPool[];
  transactionState: AddLiquidityState;
  connectionStatus: HashConnectConnectionState;
  connectToWallet: () => void;
  fetchSpotPrices: (selectedAccountId: string) => Promise<void>;
  sendAddLiquidityTransaction: ({
    inputToken,
    outputToken,
    contractId,
    transactionDeadline,
  }: SendAddLiquidityTransactionParams) => Promise<void>;
  resetAddLiquidityState: () => Promise<void>;
}

export function AddLiquidityForm(props: AddLiquidityFormProps) {
  const title = "Add Liquidity";
  const addLiquidityForm = useForm<AddLiquidityFormData>({
    defaultValues: {
      ...InitialAddLiquidityFormState,
    },
  });
  const formValues: AddLiquidityFormData = structuredClone(addLiquidityForm.getValues());

  const formSettings = useFormSettings({
    initialSlippage: formValues.slippage,
    initialTransactionDeadline: formValues.transactionDeadline,
  });
  addLiquidityForm.watch("firstToken.displayAmount");
  addLiquidityForm.watch("firstToken.symbol");
  addLiquidityForm.watch("secondToken.symbol");

  const [isConfirmAddLiquidityDialogOpen, setIsConfirmAddLiquidityDialogOpen] = useState(false);

  const selectedPairContractId = formValues.firstToken.tokenMeta.pairAccountId ?? "";
  usePoolsData(REFRESH_INTERVAL);
  useSwapData(selectedPairContractId, REFRESH_INTERVAL);

  function createTransactionDeadlineErrorMessage(transactionDeadline: number): string {
    if (transactionDeadline <= TransactionDeadline.Min) {
      return "Transaction deadline must be greater than 0 minutes.";
    }
    if (transactionDeadline > TransactionDeadline.Max) {
      return "Transaction deadline is over the maximum allowed time limit (3 minutes).";
    }
    return "";
  }

  const transactionDeadlineErrorMessage = createTransactionDeadlineErrorMessage(formValues.transactionDeadline);
  const isWalletPaired = props.connectionStatus === HashConnectConnectionState.Paired;
  const isTransactionDeadlineValid =
    formSettings.transactionDeadline > TransactionDeadline.Min &&
    formSettings.transactionDeadline <= TransactionDeadline.Max;
  const formattedTransactionDeadline =
    formSettings.transactionDeadline > TransactionDeadline.Min
      ? `${Number(formSettings.transactionDeadline)} min`
      : DefaultAmount;

  const isSubmitButtonDisabled =
    isEmpty(formValues.firstToken.displayAmount) ||
    isNil(formValues.firstToken.symbol) ||
    isEmpty(formValues.secondToken.displayAmount) ||
    isNil(formValues.secondToken.symbol) ||
    !isTransactionDeadlineValid;

  const successMessage = `Added
  ${formValues.firstToken.amount.toFixed(6)} 
  ${formValues.firstToken.symbol}
  and ${formValues.secondToken.amount.toFixed(6)} ${formValues.secondToken.symbol} to pool.`;

  const notification = useNotification({
    successMessage,
    transactionState: {
      transactionWaitingToBeSigned: props.transactionState.status === "in progress",
      successPayload: props.transactionState.successPayload?.transactionResponse ?? null,
      errorMessage: props.transactionState.errorMessage,
    },
  });

  const spotPrice = getSpotPrice({
    spotPrices: props.spotPrices,
    tokenToTrade: formValues.firstToken,
    tokenToReceive: formValues.secondToken,
  });

  const poolRatio = calculatePoolRatio(
    formValues.firstToken.symbol ?? "",
    formValues.secondToken.symbol ?? "",
    props.userPoolsMetrics
  );

  const exchangeRatio = getExchangeRateDisplay({
    spotPrice,
    tokenToTradeSymbol: formValues.firstToken.symbol,
    tokenToReceiveSymbol: formValues.secondToken.symbol,
  });

  const tokensWithPairs = getTokensByUniqueAccountIds(props.tokenPairs ?? []);
  const tokensPairedWithFirstToken = getPairedTokens(
    formValues.firstToken?.tokenMeta?.tokenId ?? "",
    formValues.firstToken?.tokenMeta?.pairAccountId ?? "",
    props.tokenPairs ?? []
  );

  /** Update Balances */
  useEffect(() => {
    const firstTokenBalance = getTokenBalance(
      formValues.firstToken.tokenMeta.tokenId ?? "",
      props.pairedAccountBalance
    );
    const secondTokenBalance = getTokenBalance(
      formValues.secondToken.tokenMeta.tokenId ?? "",
      props.pairedAccountBalance
    );
    addLiquidityForm.setValue("firstToken.balance", firstTokenBalance);
    addLiquidityForm.setValue("secondToken.balance", secondTokenBalance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(props.pairedAccountBalance)]);

  function onSubmit(data: AddLiquidityFormData) {
    if (data.firstToken.symbol === undefined || data.secondToken.symbol === undefined) {
      console.error("Tokens must be selected to add liquidity to a pool.");
      return;
    }
    const transactionDeadlineInSeconds = convertNumberOfMinsToSeconds(data.transactionDeadline);
    props.sendAddLiquidityTransaction({
      inputToken: {
        symbol: data.firstToken.symbol,
        amount: data.firstToken.amount,
        address: data.firstToken.tokenMeta.tokenId ?? "",
      },
      outputToken: {
        symbol: data.firstToken.symbol,
        amount: data.secondToken.amount,
        address: data.secondToken.tokenMeta.tokenId ?? "",
      },
      contractId: data.secondToken.tokenMeta.pairAccountId ?? "",
      transactionDeadline: transactionDeadlineInSeconds,
    });
  }

  function handleFirstTokenAmountChanged(updatedToken: TokenState) {
    const secondTokenSpotPrice = getSpotPrice({
      spotPrices: props.spotPrices,
      tokenToTrade: formValues.firstToken,
      tokenToReceive: formValues.secondToken,
    });
    const secondTokenAmount = getTokenExchangeAmount(updatedToken.amount, secondTokenSpotPrice);
    const updatedSecondToken = {
      ...formValues.secondToken,
      amount: secondTokenAmount || 0,
      displayAmount: secondTokenAmount ? String(secondTokenAmount) : "",
    };
    addLiquidityForm.setValue("secondToken.amount", updatedSecondToken.amount);
    addLiquidityForm.setValue("secondToken.displayAmount", updatedSecondToken.displayAmount);
  }

  function handleFirstTokenSymbolChanged(updatedToken: TokenState) {
    addLiquidityForm.setValue("secondToken", InitialAddLiquidityFormState.secondToken);
  }

  function handleSecondTokenAmountChanged(updatedToken: TokenState) {
    const firstTokenSpotPrice = getSpotPrice({
      spotPrices: props.spotPrices,
      tokenToTrade: formValues.secondToken,
      tokenToReceive: formValues.firstToken,
    });
    const firstTokenAmount = getTokenExchangeAmount(updatedToken.amount, firstTokenSpotPrice);
    const updatedFirstToken = {
      ...formValues.firstToken,
      amount: firstTokenAmount || 0,
      displayAmount: firstTokenAmount ? String(firstTokenAmount) : "",
    };
    addLiquidityForm.setValue("firstToken.amount", updatedFirstToken.amount);
    addLiquidityForm.setValue("firstToken.displayAmount", updatedFirstToken.displayAmount);
  }

  function handleSecondTokenSymbolChanged(updatedToken: TokenState) {
    const { tokenToTradeData: firstTokenData, tokenToReceiveData: secondTokenData } = getPairedTokenData(
      formValues.firstToken.tokenMeta.tokenId ?? "",
      updatedToken.tokenMeta.tokenId ?? "",
      props.tokenPairs ?? []
    );
    const firstTokenBalance = getTokenBalance(firstTokenData?.tokenMeta.tokenId ?? "", props.pairedAccountBalance);
    const updatedFirstToken = {
      ...formValues.firstToken,
      tokenMeta: firstTokenData?.tokenMeta ?? formValues.firstToken.tokenMeta,
      symbol: firstTokenData?.symbol ?? formValues.firstToken.symbol,
      balance: firstTokenBalance,
    };
    addLiquidityForm.setValue("firstToken.symbol", updatedFirstToken.symbol);
    addLiquidityForm.setValue("firstToken.balance", updatedFirstToken.balance);
    addLiquidityForm.setValue("firstToken.tokenMeta", updatedFirstToken.tokenMeta);
    const secondTokenBalance = getTokenBalance(secondTokenData?.tokenMeta.tokenId ?? "", props.pairedAccountBalance);
    const updatedSecondToken = {
      ...formValues.secondToken,
      symbol: secondTokenData?.symbol,
      tokenMeta: secondTokenData?.tokenMeta ?? DefaultTokenMeta,
      balance: secondTokenBalance,
    };
    addLiquidityForm.setValue("secondToken.symbol", updatedSecondToken.symbol);
    addLiquidityForm.setValue("secondToken.balance", updatedSecondToken.balance);
    addLiquidityForm.setValue("secondToken.tokenMeta", updatedSecondToken.tokenMeta);
    props.fetchSpotPrices(updatedFirstToken.tokenMeta.pairAccountId ?? "");
  }

  function handleSetFirstTokenAmountWithFormula(updatedToken: TokenState) {
    const secondTokenSpotPrice = getSpotPrice({
      spotPrices: props.spotPrices,
      tokenToTrade: updatedToken,
      tokenToReceive: formValues.secondToken,
    });
    const secondTokenAmount = getTokenExchangeAmount(updatedToken.amount, secondTokenSpotPrice);
    const updatedSecondTokenAmount = {
      ...formValues.secondToken,
      amount: secondTokenAmount || 0,
      displayAmount: secondTokenAmount ? String(secondTokenAmount) : "",
    };
    addLiquidityForm.setValue("secondToken.amount", updatedSecondTokenAmount.amount);
    addLiquidityForm.setValue("secondToken.displayAmount", updatedSecondTokenAmount.displayAmount);
  }

  function handleSetSecondTokenAmountWithFormula(updatedToken: TokenState) {
    const firstTokenSpotPrice = getSpotPrice({
      spotPrices: props.spotPrices,
      tokenToTrade: updatedToken,
      tokenToReceive: formValues.firstToken,
    });
    const firstTokenAmount = getTokenExchangeAmount(updatedToken.amount, firstTokenSpotPrice);
    const updatedFirstTokenAmount = {
      ...formValues.firstToken,
      amount: firstTokenAmount || 0,
      displayAmount: firstTokenAmount ? String(firstTokenAmount) : "",
    };
    addLiquidityForm.setValue("firstToken.amount", updatedFirstTokenAmount.amount);
    addLiquidityForm.setValue("firstToken.displayAmount", updatedFirstTokenAmount.displayAmount);
  }

  return (
    <form onSubmit={addLiquidityForm.handleSubmit(onSubmit)} id="add-liquidity-form">
      <DefiFormLayout
        title={<Text textStyle="h2">{title}</Text>}
        settingsButton={
          <SettingsButton
            isError={!isTransactionDeadlineValid}
            display={formattedTransactionDeadline}
            onClick={formSettings.handleSettingsButtonClicked}
          />
        }
        notification={
          notification.isSuccessNotificationVisible && (
            <Notification
              type={NotficationTypes.SUCCESS}
              textStyle="b3"
              message={notification.successNotificationMessage}
              isLinkShown={true}
              linkText="View in HashScan"
              linkRef={notification.hashscanTransactionLink}
              isCloseButtonShown={true}
              handleClickClose={notification.handleCloseNotificationButtonClicked}
            />
          )
        }
        settingsInputs={
          <FormSettings
            isTransactionDeadlineValid={isTransactionDeadlineValid}
            isSettingsOpen={formSettings.isSettingsOpen}
            handleSlippageChanged={formSettings.handleSlippageChanged}
            handleTransactionDeadlineChanged={formSettings.handleTransactionDeadlineChanged}
            register={addLiquidityForm.register}
          />
        }
        isSettingsOpen={formSettings.isSettingsOpen}
        formInputs={[
          <TokenInput
            form={addLiquidityForm}
            fieldValue="firstToken"
            label="First Token"
            isHalfAndMaxButtonsVisible={true}
            walletConnectionStatus={props.connectionStatus}
            pairedAccountBalance={props.pairedAccountBalance}
            selectedTokenId={formValues.firstToken.tokenMeta.tokenId ?? ""}
            selectableTokens={tokensWithPairs}
            isLoading={props.isLoading}
            tokenPairs={props.tokenPairs ?? []}
            onTokenAmountChanged={handleFirstTokenAmountChanged}
            onTokenSymbolChanged={handleFirstTokenSymbolChanged}
            onSetInputAmountWithFormula={handleSetFirstTokenAmountWithFormula}
          />,
          <Spacer />,
          <TokenInput
            form={addLiquidityForm}
            fieldValue="secondToken"
            label="Second Token"
            isHalfAndMaxButtonsVisible={true}
            walletConnectionStatus={props.connectionStatus}
            pairedAccountBalance={props.pairedAccountBalance}
            selectedTokenId={formValues.secondToken.tokenMeta.tokenId ?? ""}
            selectableTokens={tokensPairedWithFirstToken}
            isLoading={props.isLoading}
            tokenPairs={props.tokenPairs ?? []}
            onTokenAmountChanged={handleSecondTokenAmountChanged}
            onTokenSymbolChanged={handleSecondTokenSymbolChanged}
            onSetInputAmountWithFormula={handleSetSecondTokenAmountWithFormula}
          />,
        ]}
        metrics={[
          <MetricLabel label="Share of Pool" value={poolRatio} isLoading={props.isLoading} />,
          <MetricLabel label="Exchange Ratio" value={exchangeRatio} isLoading={props.isLoading} />,
        ]}
        actionButtonNotifications={[
          !isTransactionDeadlineValid ? (
            <Notification type={NotficationTypes.ERROR} textStyle="b3" message={transactionDeadlineErrorMessage} />
          ) : null,
        ].filter((notification: React.ReactNode) => !isNil(notification))}
        actionButtons={
          isWalletPaired ? (
            <>
              <AlertDialog
                title="Confirm Add Liquidity"
                openDialogButtonText="Add Liquidity"
                isOpenDialogButtonDisabled={isSubmitButtonDisabled}
                body={
                  <Flex flexDirection="column">
                    <Flex paddingBottom="0.25rem">
                      <Text flex="2" textStyle="b1">
                        First Token
                      </Text>
                      <Text flex="2" textStyle="b1" textAlign="right">
                        {formValues.firstToken.displayAmount}
                      </Text>
                    </Flex>
                    <Flex>
                      <Text flex="2" textStyle="b1">
                        Second Token
                      </Text>
                      <Text flex="2" textStyle="b1" textAlign="right">
                        {formValues.secondToken.displayAmount}
                      </Text>
                    </Flex>
                    <Spacer padding="0.667rem" />
                    <Flex flexDirection="column" gap="0.5rem">
                      <Flex>
                        <Text flex="1" textStyle="b3" color={Color.Grey_02}>
                          Share of Pool
                        </Text>
                        <Text flex="2" textStyle="b3" textAlign="right">
                          {poolRatio}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text flex="1" textStyle="b3" color={Color.Grey_02}>
                          Exchange Rate
                        </Text>
                        <Text flex="2" textStyle="b3" textAlign="right">
                          {exchangeRatio}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text flex="1" textStyle="b3" color={Color.Grey_02}>
                          Gas Fee
                        </Text>
                        <Text flex="2" textStyle="b3" textAlign="right">
                          {"--"}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                }
                footer={
                  <Button
                    variant="primary"
                    flex="1"
                    isDisabled={isSubmitButtonDisabled}
                    onClick={() => {
                      setIsConfirmAddLiquidityDialogOpen(false);
                      addLiquidityForm.handleSubmit(onSubmit)();
                      notification.setIsNotificationVisible(true);
                    }}
                  >
                    Add Liquidity
                  </Button>
                }
                alertDialogOpen={isConfirmAddLiquidityDialogOpen}
                onAlertDialogOpen={() => setIsConfirmAddLiquidityDialogOpen(true)}
                onAlertDialogClose={() => setIsConfirmAddLiquidityDialogOpen(false)}
              />
              <LoadingDialog
                isOpen={props.transactionState.status === TransactionStatus.IN_PROGRESS}
                message={"Please confirm the add liquidity transaction in your wallet to proceed."}
              />
              <LoadingDialog
                isOpen={props.transactionState.status === TransactionStatus.ERROR}
                message={props.transactionState.errorMessage ?? ""}
                icon={<WarningIcon color="#EF5C5C" h={10} w={10} />}
                buttonConfig={{
                  text: "Dismiss",
                  onClick: () => {
                    props.resetAddLiquidityState();
                  },
                }}
              />
            </>
          ) : (
            <Button variant="primary" data-testid="connect-wallet-button" onClick={props.connectToWallet}>
              Connect Wallet
            </Button>
          )
        }
      />
    </form>
  );
}