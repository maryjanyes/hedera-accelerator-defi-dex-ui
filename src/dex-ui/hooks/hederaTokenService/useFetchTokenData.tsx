import { HTSQueries } from "./types";
import { useQuery } from "react-query";
import { DexService, MirrorNodeTokenById } from "@services";
import { isNil } from "ramda";

export interface UseFetchTokenDataParams {
  tokenId: string;
  handleTokenSuccessResponse: (data: MirrorNodeTokenById) => void;
  handleTokenErrorResponse: () => void;
}

type UseTokenQueryKey = [HTSQueries.Token, string];

export function useFetchTokenData(params: UseFetchTokenDataParams) {
  const { tokenId, handleTokenErrorResponse, handleTokenSuccessResponse } = params;
  return useQuery<MirrorNodeTokenById, Error, MirrorNodeTokenById, UseTokenQueryKey>(
    [HTSQueries.Token, tokenId],
    async () => {
      return DexService.fetchTokenData(params.tokenId);
    },
    {
      enabled: !!tokenId,
      staleTime: 5,
      keepPreviousData: true,
      onSuccess: (data: MirrorNodeTokenById | undefined) => {
        if (isNil(data)) return;
        handleTokenSuccessResponse(data);
      },
      onError: () => {
        handleTokenErrorResponse();
      },
    }
  );
}
