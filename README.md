# srs2

**srs2** is a Node.js implementation of the Sender Rewriting Scheme (SRS), a mechanism to prevent SPF-related email delivery issues when forwarding emails.

## Description

When an email is forwarded, the original sender's address is often preserved. However, when the receiving server performs SPF (Sender Policy Framework) checks, it will reject the forwarded email because the forwarding server is not listed as an authorized sender for the original domain.

SRS addresses this by rewriting the sender's email address to an address within the forwarding domain. This new address includes a hash and a timestamp to ensure that the address is valid and to prevent abuse. When a bounce or reply is sent to the rewritten address, it can be decoded to retrieve the original sender's address.

This package provides a command-line interface (CLI) and a JavaScript class to perform SRS encoding and decoding.

## SRS Email Format

An SRS email address is composed of several parts, separated by `=`:

`SRS0=HHH=TT=domain.com=user@srs.domain.com`

*   **`SRS0`**: The prefix, indicating that this is an SRS address.
*   **`HHHH`**: A hash-based message authentication code (HMAC) to verify the integrity of the address.
*   **`TT`**: A timestamp to prevent replay attacks.
*   **`gmail.com=user`**: The original email address, with the `@` replaced by `=` and with a reverse order
*   **`example.com`**: The domain of the forwarding server.

For example, the email address `user@gmail.com` might be rewritten as:

`SRS0=785F=2K=gmail.com=user@example.com`

## Validity Period

SRS addresses include a timestamp to prevent replay attacks and to ensure that the address is not used indefinitely. By default, an SRS address is considered valid for 90 days from its creation. If an attempt is made to decode an SRS address older than this period, an `SRS_TOO_OLD` error will be thrown.

This validity period can be configured when initializing the `SRSRewriter` class or via the CLI.

## Error Codes

The `srs2` library throws `Error` objects with a `code` property for easier programmatic error handling. The possible error codes are:

*   `INVALID_EMAIL_FORMAT`: The provided email address is not in a valid format.
*   `INVALID_DATE_FORMAT`: The provided date string is not in the expected `YYYY-MM-DD` format.
*   `INVALID_DATE_PROVIDED`: The provided date is invalid (e.g., non-existent date).
*   `INVALID_SRS_FORMAT`: The SRS address string does not have the expected number of parts.
*   `INVALID_PREFIX`: The SRS address prefix does not match the configured prefix.
*   `INVALID_SRS`: The SRS address hash verification failed, indicating a corrupted or tampered address, or an incorrect secret key.
*   `INVALID_TIMESTAMP`: An invalid character was found in the encoded timestamp.
*   `SRS_TOO_OLD`: The SRS address is older than the configured validity period.

## Installation

```bash
npm install srs2
```

## Usage

### Library

The `srs2` package can be used as a library in your Node.js applications.

```javascript
const SRS = require('srs2');

// for production, don't leave these config in the code
const srs = new SRS({key: 'my-secret-key', prefix: 'SRS0', domain: 'example.com', validityDays: 90});

// Encode an email address
const originalEmail = 'user@gmail.com';
const srsAddress = srs.encode(originalEmail);
console.log(`SRS Address: ${srsAddress}`);

// Decode an SRS address
const decodedAddress = srs.decode(srsAddress);
console.log(`Original Address: ${decodedAddress.email}`);
```

### CLI

The package includes a CLI for encoding and decoding SRS addresses. 
The CLI automatically determines whether to encode or decode an address based on its format: If the email has 5 parts separated by a =, it will be decoded; otherwise, it will be encoded.

**Configuration:**

The CLI can be configured using environment variables or command-line parameters.

*   **`SRS_KEY`**: The secret key used for generating the SRS hash.
*   **`SRS_DOMAIN`**: The domain to use for the rewritten email address (e.g., `example.com`).
*   **`SRS_PREFIX`**: The prefix for the SRS address (default: `SRS0`).

You can also define them:
- into a .env file (copy .env.example to .env and update accordingly)
- directly on the command line as flags

**Commands:**

*   **Encode an email address:**

    ```bash
    ./cli.js <email> [--domain example.com] [--date 2025-07-29] [--prefix SRS0] [--key your-secret-key]
    ```

*   **Decode an SRS address:**

    ```bash
    ./cli.js <srs_address> 
    ```


**Options:**

*   `-h, --help`: Show the help message.
*   `-k, --key <key>`: Overrides the `SRS_KEY` environment variable.
*   `-p, --prefix <prefix>`: Overrides the `SRS_PREFIX` environment variable.
*   `-d, --date <date>`: The date to use for the timestamp (format: `YYYY-MM-DD`). Defaults to the current date.
*   `--domain <domain>`: Overrides the `SRS_DOMAIN` environment variable.

**Examples:**

assuming a .env containing


    SRS_KEY="my-secret-key"
    SRS_DOMAIN="example.com"


*   **Encode an email:**

    ```bash
    $npx srs2 user@gmail.com
    SRS0=785F=2K=gmail.com=user@example.com

    ```
or 

*   **Decode an SRS address:**

    ```bash
    $npx srs2 SRS0=785F=2K=gmail.com=user@example.com
    user@gmail.com 2025-07-29
    ```

## License

MIT
