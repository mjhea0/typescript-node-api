import { request, expect } from '../common/dependency';

describe('baseRoute', () => {
  let response;
  before ('call to the API', async () => {
    response = await request
      .get('/');
  });

  it('should be json', () => {
      expect(response.type).to.eql('application/json');
    });

  it('should have a message prop', () => {
      expect(response.body.message).to.eql('Hello World!');
  });

});
