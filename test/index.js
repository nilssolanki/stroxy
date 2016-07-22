const stroxy = require('../index');

const EventEmitter = require('events');
const chai = require('chai');
const expect = chai.expect;

const intervalDuration = 200;

describe('stroxy', () => {
  let emitter, myGlobal;

  beforeEach(() => {
    emitter = stroxy(new EventEmitter());
    myGlobal = stroxy(global);
  });

  it('should return a proxied element which has streamable functions', (done) => {
    expect(myGlobal.setInterval).to.be.a('function');

    const stream = myGlobal.setInterval(intervalDuration);
    const stream2 = myGlobal.setInterval(intervalDuration);

    expect(stream).to.be.a('object');
    expect(stream).to.have.property('pipe');
    expect(stream).to.have.property('onValue');
    expect(stream).to.have.property('event');
    expect(Object.getPrototypeOf(stream)).to.be.equal(Object.getPrototypeOf(stream2));

    done();
  });

  it('should be pipeable, return a value at the end and be unbound after one iteration', (done) => {
  	const stream = myGlobal.setInterval(intervalDuration);

    let counter = 0;
    const pipes = stream
      .pipe(_ => ++counter);

    pipes.onValue(value => {
      expect(value).to.be.equal(1);
      expect(value).to.be.equal(counter);

      myGlobal.clearInterval(stream);

      done();
    });
  });

  it('should allow for multiple child streams with different values', (done) => {
  	const stream = myGlobal.setInterval(intervalDuration);

    let counterPlus = 0;
    const pipePlus = stream
      .pipe(_ => ++counterPlus);

    let counterMinus = 0;
    const pipeMinus = stream
      .pipe(_ => --counterMinus);

    const promisePlus = new Promise((resolve) => {
      pipePlus.onValue(value => {
        expect(value).to.be.equal(1);
        expect(value).to.be.equal(counterPlus);

        resolve();
      });
    });

    const promiseMinus = new Promise((resolve) => {
      pipeMinus.onValue(value => {
        expect(value).to.be.equal(-1);
        expect(value).to.be.equal(counterMinus);

        resolve();
      });
    });

    Promise
      .all([
        promisePlus,
        promiseMinus
      ])
      .then(_ => {
        myGlobal.clearInterval(stream);
        done();
      });
  });

  it('should allow for a single child streams to be removed without stopping the others', (done) => {
	const stream = myGlobal.setInterval(intervalDuration);

    let counterPlus = 0;
    const pipePlus = stream
      .pipe(_ => ++counterPlus);

    let counterMinus = 0;
    const pipeMinus = stream
      .pipe(_ => --counterMinus);

    const promisePlus = new Promise((resolve) => {
      pipePlus.onValue(value => {
        expect(value).to.be.equal(1);
        expect(value).to.be.equal(counterPlus);

        myGlobal.clearInterval(pipePlus);

        resolve();
      });
    });

    const promiseMinus = new Promise((resolve) => {
      pipeMinus.onValue(value => {
        if (value < -1) {
          resolve();
        }
      });
    });

    Promise
      .all([
        promisePlus,
        promiseMinus
      ])
      .then(_ => {
        myGlobal.clearInterval(stream);
        done();
      });
  });
});