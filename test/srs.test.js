import test from 'ava';
import SRSRewriter from '../srs.mjs';

const srs = new SRSRewriter({
  key: 'secret',
  prefix: 'SRS0',
  domain: 'example.com',
});

test('parseEmail with valid email', t => {
    const email = 'user@domain.com';
    const parsed = srs.parseEmail(email);
    t.deepEqual(parsed, { username: 'user', domain: 'domain.com' });
});

test('parseEmail with invalid email', t => {
    const email = 'userdomain.com';
    const error = t.throws(() => {
        srs.parseEmail(email);
    });
    t.is(error.code, 'INVALID_EMAIL_FORMAT');
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
    t.is(error.code, 'INVALID_SRS');
    t.is(error.message, 'SRS has verification failed: invalid secret key or corrupted SRS address');
});

test('decode with invalid timestamp', t => {
    const srsAddress = srs.encode('user@gmail.com', '2025-04-09');
    const parts = srsAddress.split('=');
    parts[2] = '2J'; // Tamper with the timestamp
    const tamperedAddress = parts.join('=');

    const error = t.throws(() => {
        srs.decode(tamperedAddress);
    }, { instanceOf: Error });
    t.is(error.code, 'INVALID_SRS');
    t.is(error.message, 'SRS has verification failed: invalid secret key or corrupted SRS address');
});

test("encode with today's date is same as no date", t => {
    const email = 'user@domain.com';
    const today = new Date().toISOString().slice(0, 10);
    const srsAddressWithDate = srs.encode(email, today);
    const srsAddressWithoutDate = srs.encode(email);
    t.is(srsAddressWithDate, srsAddressWithoutDate);
});

test('hardcoded dates 1024 days apart produce the same numerical timestamp', t => {
    const email = 'user@domain.com';
    const date1 = '2025-07-30';
    const date2 = '2028-05-19'; // 2025-07-30 + 1024 days

    const srsAddress1 = srs.encode(email, date1);
    const srsAddress2 = srs.encode(email, date2);

    const timestamp1 = srs.decodeInt32(srsAddress1.split('=')[2]);
    const timestamp2 = srs.decodeInt32(srsAddress2.split('=')[2]);

    t.is(timestamp1, timestamp2);
});

test('decode throws SRS_TOO_OLD error for old SRS address', t => {
    const oldSrs = new SRSRewriter({
        key: 'secret',
        prefix: 'SRS0',
        domain: 'example.com',
        validityDays: 1,
    });

    const email = 'user@domain.com';
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 2); // 2 days ago, older than 1 day validity
    const oldDateString = oldDate.toISOString().slice(0, 10);

    const srsAddress = oldSrs.encode(email, oldDateString);

    const error = t.throws(() => {
        oldSrs.decode(srsAddress);
    }, { instanceOf: Error });
    t.is(error.code, 'SRS_TOO_OLD');
    t.true(error.message.includes('SRS address is too old'));
});

test('default validityDays: 89 days old is valid', t => {
    const email = 'user@domain.com';
    const date89DaysAgo = new Date();
    date89DaysAgo.setDate(date89DaysAgo.getDate() - 89);
    const srsAddress = srs.encode(email, date89DaysAgo.toISOString().slice(0, 10));
    t.notThrows(() => {
        srs.decode(srsAddress);
    });
});

test('default validityDays: 90 days old is invalid', t => {
    const email = 'user@domain.com';
    const date90DaysAgo = new Date();
    date90DaysAgo.setDate(date90DaysAgo.getDate() - 90);
    const srsAddress = srs.encode(email, date90DaysAgo.toISOString().slice(0, 10));

    const error = t.throws(() => {
        srs.decode(srsAddress);
    }, { instanceOf: Error });
    t.is(error.code, 'SRS_TOO_OLD');
    t.true(error.message.includes('SRS address is too old'));
});


