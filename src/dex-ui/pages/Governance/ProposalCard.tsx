import {
  Text,
  Box,
  Flex,
  Spacer,
  VStack,
  Tag,
  Popover,
  PopoverContent,
  PopoverBody,
  PopoverTrigger,
  PopoverArrow,
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Card, HorizontalStackBarChart } from "../../../dex-ui-components";
import { Color } from "../../../dex-ui-components/themes";
import { ProposalStatus } from "../../store/governanceSlice";
import { getStatusColor, getShortDescription } from "../../utils";
import { FormattedProposal } from "./types";

interface ProposalCardProps {
  proposal: FormattedProposal;
}

export const ProposalCard = (props: ProposalCardProps) => {
  const { proposal } = props;
  const navigate = useNavigate();

  const statusColor = getStatusColor(proposal.status, proposal.state);

  return (
    /** TODO: Update UI Library Card component to accept style variants. */
    <Card
      variant="proposal-card"
      height="99px"
      minHeight="99px"
      borderRadius="0px"
      padding="0.25rem"
      onClick={() => navigate(`/governance/proposal-details/${proposal.id}`)}
    >
      <Flex gap="8" alignItems="center" height="100%">
        <Box bg={statusColor} width="0.25rem" height="100%"></Box>
        <Flex direction="column" alignItems="start" justifyContent="center" flex="2" gap="1">
          <Text textStyle="h4" color={statusColor}>
            {proposal.status}
          </Text>
          <Text textStyle="b3" color={statusColor}>
            {proposal.status === ProposalStatus.Active ? proposal.timeRemaining : proposal.state}
          </Text>
        </Flex>
        <Box flex="12" padding="0.5rem 0">
          <VStack alignItems="start">
            <Flex width="100%" flexDirection="row">
              <Flex flex="12" textAlign="left" alignItems="center">
                <Text
                  textStyle="h3"
                  paddingRight="0.5rem"
                  maxWidth="500px"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {proposal.title}
                </Text>
                <Tag textStyle="b3" size="sm" minWidth="fit-content" height="fit-content">
                  {proposal.type}
                </Tag>
              </Flex>
              <Spacer flex="1" />
              <Text flex="4" textAlign="right" textStyle="b2">{`Author ${proposal.author.toString()}`}</Text>
            </Flex>
            <Text textStyle="b2" textAlign="left">
              {getShortDescription(proposal.description)}
            </Text>
          </VStack>
        </Box>
        <Popover trigger="hover">
          <PopoverTrigger>
            <Box flex="4" margin="auto 1rem auto 0">
              <HorizontalStackBarChart
                quorum={proposal.votes.quorum}
                data={[
                  { value: proposal.votes.yes ?? 0, bg: Color.Blue_01 },
                  { value: proposal.votes.no ?? 0, bg: "#DF5656" },
                  { value: proposal.votes.abstain ?? 0, bg: "#757575" },
                  { value: proposal.votes.remaining ?? 0, bg: Color.Grey_01 },
                ]}
              />
            </Box>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverBody width="100%">
              <HStack width="100%">
                <VStack wrap={"initial"}>
                  <Text textStyle="b3">Yes</Text>
                  <Text textStyle="h2">{proposal.votes.yes}</Text>
                </VStack>
                <Spacer />
                <VStack>
                  <Text textStyle="b3">No</Text>
                  <Text textStyle="h2">{proposal.votes.no}</Text>
                </VStack>
                <Spacer />
                <VStack>
                  <Text textStyle="b3">Abstain</Text>
                  <Text textStyle="h2">{proposal.votes.abstain}</Text>
                </VStack>
                <Spacer />
                <VStack>
                  <Text textStyle="b3">Remaining</Text>
                  <Text textStyle="h2">{proposal.votes.remaining}</Text>
                </VStack>
              </HStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>
    </Card>
  );
};
