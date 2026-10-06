export const createMockModels = () => {
  const mockProductModel = { countDocuments: jest.fn() };
  const mockConnection = { models: { Product: mockProductModel } };
  const mockCategoryModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  };

  return { mockProductModel, mockConnection, mockCategoryModel };
};

export const queryResult = <T>(val: T) => {
  const queryChain: Record<string, jest.Mock> = {
    exec: jest.fn().mockResolvedValue(val),
  };
  queryChain.select = jest.fn().mockReturnValue(queryChain);
  queryChain.sort = jest.fn().mockReturnValue(queryChain);
  queryChain.collation = jest.fn().mockReturnValue(queryChain);
  queryChain.lean = jest.fn().mockReturnValue(queryChain);
  return queryChain;
};

export const collationResult = <T>(val: T) => ({
  collation: () => ({ exec: jest.fn().mockResolvedValue(val) }),
});

export const execResult = <T>(val: T) => ({
  exec: jest.fn().mockResolvedValue(val),
});

export const leanResult = <T>(val: T) => ({
  lean: () => ({ exec: jest.fn().mockResolvedValue(val) }),
});
