# srs2

**srs2** is a Node.js implementation of the Sender Rewriting Scheme (SRS), a mechanism to prevent SPF-related email delivery issues when forwarding emails.

## Description

When an email is forwarded, the original sender's address is often preserved. However, if the receiving server performs SPF (Sender Policy Framework) checks, it may reject the forwarded email because the forwarding server is not listed as an authorized sender for the original domain.

SRS addresses this by rewriting the sender's email address to an address within the forwarding domain. This new address includes a hash and a timestamp to ensure that the address is valid and to prevent abuse. When a bounce or reply is sent to the rewritten address, it can be decoded to retrieve the original sender's address.

This package provides a command-line interface (CLI) and a JavaScript class to perform SRS encoding and decoding.

## Installation

```bash
npm install srs2
```

## Usage

### CLI

The package includes a CLI for encoding and decoding SRS addresses.

**Configuration:**

The CLI can be configured using environment variables or command-line parameters.

*   **`SRS_KEY`**: (Required) The secret key used for generating the SRS hash.
*   **`SRS_DOMAIN`**: The domain to use for the rewritten email address (e.g., `example.com`).
*   **`SRS_PREFIX`**: The prefix for the SRS address (default: `SRS0`).

They can be defined directly on the command line as flags

**Commands:**

*   **Encode an email address:**

    ```bash
    ./cli.js [options] <email>
    ```

*   **Decode an SRS address:**

    ```bash
    ./cli.js <srs_address>
    ```


**Options:**

*   `-k, --key <key>`: Overrides the `SRS_KEY` environment variable.
*   `-p, --prefix <prefix>`: Overrides the `SRS_PREFIX` environment variable.
*   `-d, --date <date>`: The date to use for the timestamp (format: `YYYY-MM-DD`). Defaults to the current date.
*   `--domain <domain>`: Overrides the `SRS_DOMAIN` environment variable.
*   `-h, --help`: Show the help message.

**Examples:**

*   **Encode an email:**

    ```bash
    export SRS_KEY="my-secret-key"
    export SRS_DOMAIN="mydomain.com"
    ./cli.js user@example.com
    ```

*   **Decode an SRS address:**

    ```bash
    export SRS_KEY="my-secret-key"
    ./cli.js SRS0=HHH=TT=example.com=user@mydomain.com
    ```

### Library

The `srs2` package can also be used as a library in your Node.js applications.

```javascript
const SRS = require('srs2');

const srsKey = 'my-secret-key';
const srsPrefix = 'SRS0';
const srsDomain = 'mydomain.com';

const srs = new SRS(srsKey, srsPrefix, srsDomain);

// Encode an email address
const originalEmail = 'user@example.com';
const srsAddress = srs.encode(originalEmail);
console.log(`SRS Address: ${srsAddress}`);

// Decode an SRS address
const decodedAddress = srs.decode(srsAddress);
console.log(`Original Address: ${decodedAddress.email}`);
```

## License

ISC
