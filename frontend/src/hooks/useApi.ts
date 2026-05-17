import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "@/api/client";
import type { PageState } from "@/types";

interface UseApiResult<T> {
  status: "loading" | "error" | "success";
  data: T | undefined;
  error: string | undefined;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiResult<T> {
  const [state, setState] = useState<PageState<T>>({ status: "loading" });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetch = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await fetcherRef.current();
      setState({ status: "success", data });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Server error. Please try again. / 服务器错误，请重试。";
      setState({ status: "error", error: message });
    }
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    status: state.status,
    data: state.status === "success" ? state.data : undefined,
    error: state.status === "error" ? state.error : undefined,
    refetch: fetch,
  };
}
