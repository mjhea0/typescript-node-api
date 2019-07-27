import { request, expect } from '../common/dependency';

describe('GET api/v1/heroes', () => {
  let response;
  before ('call to the API', async () => {
    response = await request
      .get('/api/v1/heroes');
  });

  it('responseponds with JSON array', () => {
        expect(response.status).to.equal(200);
        expect(response).to.be.json;
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.length(5);
  });

  it('should include Wolverine', () => {
        let Wolverine = response.body.find(hero => hero.name === 'Wolverine');
        expect(Wolverine).to.exist;
        expect(Wolverine).to.have.all.keys([
          'id',
          'name',
          'aliases',
          'occupation',
          'gender',
          'height',
          'hair',
          'eyes',
          'powers'
        ]);
  });

  describe('GET api/v1/heroes/:id', () => {
    let response;
    before ('call to the API', async () => {
      response = await request
        .get('/api/v1/heroes/1');
    });

    it('responseponds with single JSON object', () => {
          expect(response.status).to.equal(200);
          expect(response).to.be.json;
          expect(response.body).to.be.an('object');
    });

    it('should return Luke Cage', () => {
          expect(response.body.hero.name).to.equal('Luke Cage');
    });
  });
});
