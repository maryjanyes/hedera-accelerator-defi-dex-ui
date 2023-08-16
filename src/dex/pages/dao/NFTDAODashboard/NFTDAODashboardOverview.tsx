import { Flex, Grid, GridItem, Text, Link } from "@chakra-ui/react";
import { Color, MetricLabel } from "@shared/ui-kit";
import { useOutletContext } from "react-router-dom";
import { NFTDAODetailsContext } from "./types";
import { getDAOLinksRecordArray } from "../utils";
import { convertFromBlocksToDays } from "@dex/utils";
import { RecentProposals } from "../RecentProposals";
import { useGovernanceDAOProposals } from "@dex/hooks";

export function NFTDAODashboardOverview() {
  const { dao, totalAssetValue, tokenCount } = useOutletContext<NFTDAODetailsContext>();
  const daoLinks = getDAOLinksRecordArray(dao.webLinks);
  const daoProposalsQueryResults = useGovernanceDAOProposals(dao.accountId, dao.tokenId, dao.governors);
  const { isSuccess, isLoading, isError, error, data: proposals } = daoProposalsQueryResults;
  const recentProposals = proposals
    ?.sort((proposalA, proposalB) => +proposalB.timestamp - +proposalA.timestamp)
    .slice(0, 3);

  return (
    <Flex gap="8" direction="column" layerStyle="dao-dashboard__content-body">
      <Flex gap="4" direction="column">
        <Text textStyle="h4 medium">Overview</Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          <GridItem>
            <Flex
              direction="column"
              width="100%"
              height="100%"
              bg={Color.White_02}
              justifyContent="space-between"
              border={`1px solid ${Color.Neutral._200}`}
              borderRadius="4px"
              padding="1.5rem"
              gap="8"
            >
              <Text textStyle="p medium semibold">Assets</Text>
              <Flex direction="row">
                <Flex flex={1}>
                  <MetricLabel
                    label="TOTAL ASSETS"
                    labelTextColor={Color.Neutral._500}
                    labelTextStyle="p xsmall medium"
                    labelOpacity="1.0"
                    value={`${totalAssetValue ?? 0}`}
                    valueStyle="p large medium"
                    valueTextColor={Color.Grey_Blue._800}
                    valueUnitSymbol="USD"
                    valueUnitSymbolColor={Color.Grey_Blue._800}
                  />
                </Flex>
                <Flex flex={1}>
                  <MetricLabel
                    label="NFT"
                    labelTextColor={Color.Neutral._500}
                    labelTextStyle="p xsmall medium"
                    labelOpacity="1.0"
                    value={tokenCount ?? 0}
                    valueStyle="p large medium"
                    valueTextColor={Color.Grey_Blue._800}
                  />
                </Flex>
              </Flex>
            </Flex>
          </GridItem>
          <GridItem>
            <Flex
              direction="column"
              width="100%"
              height="100%"
              bg={Color.White_02}
              border={`1px solid ${Color.Neutral._200}`}
              borderRadius="4px"
              padding="1.5rem"
              gap="8"
            >
              <Text textStyle="p medium semibold">Governance</Text>
              <Flex direction="row" justifyContent="space-between">
                <MetricLabel
                  label="QUORUM"
                  labelTextColor={Color.Neutral._500}
                  labelTextStyle="p xsmall medium"
                  labelOpacity="1.0"
                  value={dao.quorumThreshold}
                  valueStyle="p large medium"
                  valueTextColor={Color.Neutral._900}
                  valueUnitSymbol="%"
                  valueUnitSymbolColor={Color.Neutral._900}
                />
                <MetricLabel
                  label="VOTING DURATION"
                  labelTextColor={Color.Neutral._500}
                  labelTextStyle="p xsmall medium"
                  labelOpacity="1.0"
                  value={convertFromBlocksToDays(dao.votingPeriod)}
                  valueStyle="p large medium"
                  valueTextColor={Color.Neutral._900}
                  valueUnitSymbol="blocks"
                  valueUnitSymbolColor={Color.Neutral._900}
                />

                <MetricLabel
                  label="LOCKING PERIOD"
                  labelTextColor={Color.Neutral._500}
                  labelTextStyle="p xsmall medium"
                  labelOpacity="1.0"
                  value={convertFromBlocksToDays(dao.votingDelay)}
                  valueStyle="p large medium"
                  valueTextColor={Color.Neutral._900}
                  valueUnitSymbol="blocks"
                  valueUnitSymbolColor={Color.Neutral._900}
                />

                <MetricLabel
                  label="MINIMUM PROPOSAL DEPOSIT"
                  labelTextColor={Color.Neutral._500}
                  labelTextStyle="p xsmall medium"
                  labelOpacity="1.0"
                  value={dao.minimumProposalDeposit ?? 0}
                  valueStyle="p large medium"
                  valueTextColor={Color.Neutral._900}
                  valueUnitSymbol={"FIX"}
                  valueUnitSymbolColor={Color.Neutral._900}
                />
              </Flex>
            </Flex>
          </GridItem>
          <GridItem>
            <Flex
              width="100%"
              height="100%"
              direction="column"
              bg={Color.White_02}
              justifyContent="space-between"
              border={`1px solid ${Color.Neutral._200}`}
              borderRadius="4px"
              padding="1.5rem"
              gap="8"
            >
              <Text textStyle="p medium semibold">About</Text>
              <Text textStyle="p small regular" color={Color.Neutral._700}>
                {dao.description}
              </Text>
            </Flex>
          </GridItem>
          <GridItem>
            <Flex
              width="100%"
              height="100%"
              gap={6}
              direction="column"
              bg={Color.White_02}
              justifyContent="space-between"
              border={`1px solid ${Color.Neutral._200}`}
              borderRadius="4px"
              padding="1.5rem"
            >
              <Text textStyle="p medium semibold">Social Channels</Text>
              <Flex direction="column" gap={2} justifyContent="space-between">
                {daoLinks.map((link, index) => {
                  return (
                    <Link
                      key={index}
                      textStyle="p small regular"
                      color={Color.Neutral._700}
                      href={link.value}
                      isExternal
                    >
                      {link.value}
                    </Link>
                  );
                })}
              </Flex>
            </Flex>
          </GridItem>
        </Grid>
      </Flex>
      <Flex gap="2" direction="column">
        <Text textStyle="h4 medium">Recent Proposals</Text>
        <Flex direction="column" gap="2" minHeight="300px">
          <RecentProposals
            proposals={recentProposals}
            dao={dao}
            isLoading={isLoading}
            isSuccess={isSuccess}
            isError={isError}
            error={error}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}