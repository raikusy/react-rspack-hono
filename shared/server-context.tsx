import { createContext, useContext, useEffect, useState } from "react";

export interface ServerContextI {
  isServer: boolean;
  handlers: Promise<unknown>[];
  dataMap: Record<string, unknown>;
}

const ServerContext = createContext<ServerContextI>({} as ServerContextI);

export const ServerQueryProvider = ({
  value,
  children,
}: {
  value: ServerContextI;
  children: React.ReactNode;
}) => {
  return (
    <ServerContext.Provider value={value}>{children}</ServerContext.Provider>
  );
};

export interface ServerQueryProps {
  id: string;
  handler: () => Promise<unknown>;
}

export const useServerQuery = ({ id, handler }: ServerQueryProps) => {
  const context = useContext(ServerContext);

  const [data, setData] = useState<unknown | null>(() => {
    return context.dataMap[id] ?? null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<unknown | null>(null);

  const fetchPromise = () =>
    handler()
      .then((res) => {
        context.dataMap[id] = res;
        setData(res);
      })
      .catch((err) => setError(err));

  const fetchClient = () => {
    if (!context.dataMap[id]) {
      setIsLoading(true);
    }

    fetchPromise().finally(() => setIsLoading(false));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: "I don't want to use exhaustive dependencies"
  useEffect(() => {
    if (context.isServer || typeof window === "undefined") return;

    fetchClient();
  }, []);

  if (context.isServer && context.dataMap[id] === undefined) {
    context.handlers.push(fetchPromise());
  }

  return { isLoading, data, error };
};
