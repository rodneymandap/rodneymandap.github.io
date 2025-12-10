import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../pages/api/hello';

// Mock response object
const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as NextApiResponse;
};

// Mock request object
const createMockRequest = (method = 'GET'): NextApiRequest => {
  return {
    method,
    headers: {},
    query: {},
    body: {},
  } as NextApiRequest;
};

describe('/api/hello', () => {
  it('returns a 200 status', () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns JSON response with name', () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ name: 'John Doe' });
  });

  it('handles POST requests', () => {
    const req = createMockRequest('POST');
    const res = createMockResponse();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ name: 'John Doe' });
  });

  it('handles different request methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    
    methods.forEach(method => {
      const req = createMockRequest(method);
      const res = createMockResponse();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  it('always returns the same response', () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ name: 'John Doe' });
  });
});
