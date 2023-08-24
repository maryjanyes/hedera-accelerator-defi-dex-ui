import { Text, Flex } from "@chakra-ui/react";
import { Color } from "@shared/ui-kit";

interface ProposalTransactionDetailsProps {
  transactionHash: string;
}

export function ProposalTransactionDetails(props: ProposalTransactionDetailsProps) {
  const { transactionHash } = props;
  return (
    <Flex direction="row" gap="12">
      <Flex flexDirection="column" alignItems="start" gap="2">
        <Text textStyle="p small medium">Transaction hash</Text>
      </Flex>
      <Flex flexDirection="column" alignItems="start" gap="2">
        <Text textStyle="p small regular" color={Color.Neutral._700}>
          {transactionHash}
        </Text>
      </Flex>
    </Flex>
  );
}