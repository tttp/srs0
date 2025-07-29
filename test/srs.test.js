const test = require('ava');
const SRSRewriter = require('../srs.js');

const srs = new SRSRewriter('secret', 'SRS0', 'example.com');

test('parseEmail with valid email', t => {
    const email = 'user@domain.com';
    const parsed = srs.parseEmail(email);
    t.deepEqual(parsed, { username: 'user', domain: 'domain.com' });
});

test('parseEmail with invalid email', t => {
    const email = 'userdomain.com';
    const error = t.throws(() => {
        srs.parseEmail(email);
    }, { instanceOf: Error });
    t.is(error.message, 'Invalid email format');
});

test('encode and decode roundtrip', t => {
    const email = 'user@domain.com';
    const date = '2025-07-29';
    const srsAddress = srs.encode(email, date);
    const decoded = srs.decode(srsAddress);
    t.is(decoded.email, email);
});

test('is with valid SRS address', t => {
    const srsAddress = srs.encode('user@domain.com', '2025-07-29');
    t.true(srs.is(srsAddress));
});

test('is with invalid SRS address', t => {
    t.false(srs.is('user@domain.com'));
});

test('decode with invalid hash', t => {
    const srsAddress = srs.encode('user@domain.com', '2025-07-29');
    const parts = srsAddress.split('=');
    parts[1] = 'XXXX'; // Tamper with the hash
    const tamperedAddress = parts.join('=');

    const error = t.throws(() => {
        srs.decode(tamperedAddress);
    }, { instanceOf: Error });
    t.is(error.message, 'SRS has verification failed: invalid secret key or corrupted SRS address');
});

test('encode with today\'s date is same as no date', t => {
    const email = 'user@domain.com';
    const today = new Date().toISOString().slice(0, 10);
    const srsAddressWithDate = srs.encode(email, today);
    const srsAddressWithoutDate = srs.encode(email);
    t.is(srsAddressWithDate, srsAddressWithoutDate);
});
