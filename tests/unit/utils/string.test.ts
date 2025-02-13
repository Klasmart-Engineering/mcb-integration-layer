import { expect } from 'chai';
import { stringInject, shorten } from '../../../src/utils/string';

describe('stringInject', () => {
  context('replace brackets with array items', () => {
    it('should replace brackets {0} in string with array[0]', () => {
      const str = stringInject('My username is {0}', ['tjcafferkey']);
      expect(str).to.equal('My username is tjcafferkey');
    });

    it('should replace brackets {0} and {1} in string with array[0] and array[1]', () => {
      const str = stringInject('I am {0} the {1} function', [
        'testing',
        'stringInject',
      ]);
      expect(str).to.equal('I am testing the stringInject function');
    });
  });

  context('pass in a string with no {} with an array of items', () => {
    it('should return the same string as passed in', () => {
      const str = stringInject('This should be the same', [
        'testing',
        'stringInject',
      ]);
      expect(str).to.equal('This should be the same');
    });
  });

  context('replace object values based on their keys', () => {
    it('replace object values based on one key', () => {
      const str = stringInject('My username is {username}', {
        username: 'tjcafferkey',
      });
      expect(str).to.equal('My username is tjcafferkey');
    });

    it('replace object values based on two keys', () => {
      const str = stringInject('My username is {username} on {platform}', {
        username: 'tjcafferkey',
        platform: 'GitHub',
      });
      expect(str).to.equal('My username is tjcafferkey on GitHub');
    });

    it('replace object values although the keys are omitted', () => {
      const username = 'tjcafferkey';
      const platform = 'GitHub';
      const str = stringInject('My username is {username} on {platform}', {
        username,
        platform,
      });
      expect(str).to.equal('My username is tjcafferkey on GitHub');
    });

    it('replace object values based on two keys in reverse order', () => {
      const str = stringInject('My username is {platform} on {username}', {
        username: 'tjcafferkey',
        platform: 'GitHub',
      });
      expect(str).to.equal('My username is GitHub on tjcafferkey');
    });

    it('if the key does not exist in the object it will not replace it in the string', () => {
      const str = stringInject('My username is {platform} on {username}', {
        username: 'tjcafferkey',
      });
      expect(str).to.equal('My username is {platform} on tjcafferkey');
    });

    it('replace object values based on one nested key and one regular', function () {
      const str = stringInject('My username is {user.name} on {platform}', {
        user: { name: 'Robert' },
        platform: 'IRL',
      });
      expect(str).to.equal('My username is Robert on IRL');
    });

    it('if the object has no keys then it will return the string', () => {
      const str = stringInject('My username is {platform} on {username}', {});
      expect(str).to.equal('My username is {platform} on {username}');
    });
  });

  context('pass in incorrect parameters', () => {
    it('should return false when passed a number instead of an array as second parameter', () => {
      const str = stringInject('hello', 1);
      expect(str).to.equal('hello');
    });

    it('if the data param is false bool', () => {
      const str = stringInject(
        'My username is {platform} on {username}',
        false
      );
      expect(str).to.equal('My username is {platform} on {username}');
    });

    it('if the data param is true bool', () => {
      const str = stringInject('My username is {platform} on {username}', true);
      expect(str).to.equal('My username is {platform} on {username}');
    });

    it('if the data param is a string', () => {
      const str = stringInject(
        'My username is {platform} on {username}',
        'string'
      );
      expect(str).to.equal('My username is {platform} on {username}');
    });
  });
});

describe('shorten', () => {
  it('should return string if its length is less than `length`', () => {
    const str = 'this';
    const truncatedStr = shorten(str, 7);

    expect(truncatedStr).to.equal('this');
  });

  it('should return string if its length is equal to `length`', () => {
    const str = 'this is';
    const truncatedStr = shorten(str, 7);

    expect(truncatedStr).to.equal('this is');
  });

  it('should shorten string without cutting words', () => {
    const str = 'this is a long string I need to truncate';
    const truncatedStr = shorten(str, 7);

    expect(truncatedStr).to.equal('this is');
  });

  it('should shorten string without cutting words when length is a float', () => {
    const str = 'this is a long string I need to truncate';
    const truncatedStr = shorten(str, 6.7);

    expect(truncatedStr).to.equal('this');
  });

  it('should not shorten string with cutting words when string has only one word', () => {
    const str = 'thisisalong string I need to truncate';
    const truncatedStr = shorten(str, 6.7);

    expect(truncatedStr).to.equal('thisis');
  });
});
