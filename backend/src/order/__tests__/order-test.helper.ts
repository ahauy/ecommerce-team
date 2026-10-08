export const chain = <T>(value: T) => {
  const q: Record<string, jest.Mock> = {};
  ['select', 'lean', 'session', 'sort', 'limit'].forEach((m) => {
    q[m] = jest.fn().mockReturnValue(q);
  });
  q.exec = jest.fn().mockResolvedValue(value);
  return q;
};

export const execOnly = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

export const mockConnection = () => {
  const session = {
    withTransaction: jest.fn(async (work: () => Promise<unknown>) => {
      await work();
    }),
    endSession: jest.fn().mockResolvedValue(undefined),
  };
  return {
    session,
    connection: { startSession: jest.fn().mockResolvedValue(session) },
  };
};
