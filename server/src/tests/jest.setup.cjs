process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

afterAll(() => {
  jest.restoreAllMocks();
});